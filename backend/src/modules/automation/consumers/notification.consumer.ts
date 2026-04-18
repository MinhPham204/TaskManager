import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bullmq';
import { Model } from 'mongoose';
import { TenantStorageService } from '../../../common/als/tenant-storage.service';
import { EmailService } from '../../../common/services/email.service';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { UserRole } from '../../user/schemas/user.schema';
import { ApprovalRequestPayload } from '../../task/task.service';
import { NOTIFICATION_QUEUE } from '../constants/queues';

/**
 * NotificationConsumer — BullMQ Worker xử lý queue 'notification'.
 *
 * ═══════════════════════════════════════════════════════════════
 * LUỒNG XỬ LÝ JOB 'approval-request'
 * ═══════════════════════════════════════════════════════════════
 *
 * 1. Member gọi PATCH /tasks/:id/submit
 *    → TaskService.submitForApproval() đẩy job vào NOTIFICATION_QUEUE
 *
 * 2. Worker nhận job 'approval-request' với payload:
 *    { taskId, taskTitle, organizationId, submittedByName, type }
 *
 * 3. Tái tạo ALS context qua tenantStorageService.run(organizationId)
 *    → TenantPlugin tự inject { organization: orgId } vào mọi Mongoose query
 *
 * 4. Query tất cả Users có role ADMIN hoặc OWNER trong org đó
 *    → Gửi email approval-request đến từng admin
 *
 * ═══════════════════════════════════════════════════════════════
 */
@Processor(NOTIFICATION_QUEUE)
export class NotificationConsumer extends WorkerHost {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(
    private readonly tenantStorageService: TenantStorageService,
    private readonly emailService: EmailService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super();
  }

  /**
   * Entry point cho mọi job trong queue 'notification'.
   * Dispatch theo job.name để dễ mở rộng thêm job type sau này.
   */
  async process(job: Job<ApprovalRequestPayload>): Promise<void> {
    this.logger.log(
      `[NotificationWorker] Received job "${job.name}" #${job.id}`,
    );

    switch (job.name) {
      case 'approval-request':
        await this.handleApprovalRequest(job.data);
        break;

      default:
        this.logger.warn(
          `[NotificationWorker] Unknown job name: "${job.name}" — skipped`,
        );
    }
  }

  // ─── Handler: approval-request ────────────────────────────────────────────────
  /**
   * Gửi email thông báo đến tất cả Admin/Owner trong org khi Member nộp task.
   *
   * Flow:
   *   tenantStorageService.run(orgId) → ALS context được tái tạo
   *     → UserModel.find({ role: admin/owner }) → TenantPlugin tự filter theo org
   *       → emailService.sendApprovalRequestEmail() cho từng admin
   */
  private async handleApprovalRequest(
    data: ApprovalRequestPayload,
  ): Promise<void> {
    const { taskId, taskTitle, organizationId, submittedByName } = data;

    this.logger.log(
      `[NotificationWorker] Processing approval-request: Task "${taskTitle}" (Org: ${organizationId})`,
    );

    await this.tenantStorageService.run(organizationId, async () => {
      // TenantPlugin tự inject { organization: orgId } vào query này
      const admins = await this.userModel
        .find({ role: { $in: [UserRole.ADMIN, UserRole.OWNER] } })
        .select('email name')
        .lean();

      if (admins.length === 0) {
        this.logger.warn(
          `[NotificationWorker] No admin/owner found in org ${organizationId} — no emails sent`,
        );
        return;
      }

      this.logger.log(
        `[NotificationWorker] Sending approval request emails to ${admins.length} admin(s)`,
      );

      for (const admin of admins) {
        await this.emailService.sendApprovalRequestEmail({
          to: admin.email,
          taskTitle,
          taskId,
          organizationId,
          submittedByName,
        });

        this.logger.log(
          `[NotificationWorker] ✅ Email sent to admin: ${admin.email}`,
        );
      }
    });

    this.logger.debug(
      `[NotificationWorker] ✅ Finished approval-request job for Task ID: ${taskId}`,
    );
  }
}
