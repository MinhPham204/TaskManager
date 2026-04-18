import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TenantStorageService } from '../../../common/als/tenant-storage.service';
import { EmailService } from '../../../common/services/email.service';
import { TASK_REMINDER_QUEUE } from '../constants/queues';
import { TaskReminderPayload } from '../producers/task-reminder.producer';

/**
 * TaskReminderConsumer — BullMQ Worker xử lý queue 'task-reminder'.
 *
 * ═══════════════════════════════════════════════════════════════
 * TÁI TẠO ALS CONTEXT CHO WORKER (Multi-tenancy Pattern)
 * ═══════════════════════════════════════════════════════════════
 *
 * Vấn đề: Worker chạy ngoài HTTP request lifecycle.
 *   → tenantStorage.getStore() = undefined
 *   → TenantPlugin KHÔNG filter theo org
 *   → TenantStorageService.requireOrganizationId() ném ForbiddenException
 *
 * Giải pháp: Dùng tenantStorageService.run(organizationId, fn) để
 * BOOTSTRAP ALS context thủ công trước khi gọi bất kỳ Service nào.
 *
 * Flow:
 *   job.data.organizationId (từ Producer)
 *     → tenantStorageService.run(orgId, async () => { ... })
 *       → ALS context được tái tạo
 *         → Mọi Mongoose query bên trong tự filter theo org
 *         → EmailService và các Service khác hoạt động bình thường
 * ═══════════════════════════════════════════════════════════════
 */
@Processor(TASK_REMINDER_QUEUE)
export class TaskReminderConsumer extends WorkerHost {
  private readonly logger = new Logger(TaskReminderConsumer.name);

  constructor(
    private readonly tenantStorageService: TenantStorageService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  /**
   * Entry point cho mọi job trong queue 'task-reminder'.
   */
  async process(job: Job<TaskReminderPayload>): Promise<void> {
    const {
      taskId,
      taskTitle,
      dueDate,
      organizationId,
      organizationName,
      assignedEmails,
    } = job.data;

    this.logger.log(
      `[Worker] Processing job #${job.id} — Task: "${taskTitle}" (Org: ${organizationName})`,
    );

    /**
     * ─── TÁI TẠO ALS CONTEXT ────────────────────────────────────────────────
     * tenantStorageService.run() gọi tenantStorage.run({ organizationId }, fn)
     * → Tất cả async operations bên trong kế thừa context này.
     * → Giống hệt cách TenantInterceptor hoạt động cho HTTP request.
     * → EmailService.sendTaskReminderEmail() nằm trong context → an toàn khi
     *   cần truy cập DB thêm sau này.
     */
    await this.tenantStorageService.run(organizationId, async () => {
      // Gửi email đến từng người được giao task
      for (const email of assignedEmails) {
        await this.emailService.sendTaskReminderEmail({
          to: email,
          taskTitle,
          dueDate,
          organizationName,
          taskId,
          organizationId,
        });

        this.logger.log(
          `[Worker] Sending reminder for Task: ${taskTitle} - Org: ${organizationId}`,
        );
      }

      this.logger.debug(
        `[Worker] ✅ All reminders sent for Task ID: ${taskId} (${assignedEmails.length} recipient(s))`,
      );
    });
  }
}
