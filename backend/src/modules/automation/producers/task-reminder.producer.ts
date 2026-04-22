import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from '../../task/schemas/task.schema';
import { TASK_REMINDER_QUEUE } from '../constants/queues';

export interface TaskReminderPayload {
  taskId: string;
  taskTitle: string;
  dueDate: string;
  organizationId: string;
  organizationName: string;
  assignedEmails: string[];
}

interface PopulatedTask {
  _id: Types.ObjectId;
  title: string;
  dueDate: Date;
  organization: { _id: Types.ObjectId; name: string };
  assignedTo: Array<{ _id: Types.ObjectId; email: string }>;
}

/**
 * TaskReminderProducer — Cron Job chạy mỗi 1 phút.
 *
 * Quét tất cả Task có dueDate là hôm nay (bất kể org nào),
 * populate assignedTo (email) và organization (name),
 * rồi đẩy từng job vào queue 'task-reminder' kèm đủ data để Worker gửi email.
 *
 * Lưu ý Multi-tenancy:
 * - Cron chạy NGOÀI HTTP lifecycle -> KHÔNG có ALS context.
 * - TenantPlugin bypass filter khi không có context (tenant.plugin.ts:27)
 *  -> taskModel.find() trả về task của TẤT CẢ organizations.
 * - organizationId từ task.organization -> đưa vào job payload
 *   để Consumer tái tạo ALS context khi xử lý.
 */
@Injectable()
export class TaskReminderProducer {
  private readonly logger = new Logger(TaskReminderProducer.name);

  constructor(
    @InjectQueue(TASK_REMINDER_QUEUE)
    private readonly taskReminderQueue: Queue<TaskReminderPayload>,

    @InjectModel(Task.name)
    private readonly taskModel: Model<Task>,
  ) {}

  /**
   * Production: chạy vào 8h sáng mỗi ngày.
   */
  @Cron('0 8 * * *')
  async scanDueTodayTasks(): Promise<void> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    // Dùng lean() để lấy plain objects — dễ type hơn HydratedDocument
    // Không có ALS context -> TenantPlugin bypass -> query tất cả orgs
    const tasks = (await this.taskModel
      .find({ dueDate: { $gte: startOfDay, $lte: endOfDay } })
      .populate('assignedTo', 'email')
      .populate('organization', 'name')
      .lean()
      .exec()) as unknown as PopulatedTask[];

    if (tasks.length === 0) {
      this.logger.debug(
        `[Cron] No tasks due today (${now.toISOString().slice(0, 10)})`,
      );
      return;
    }

    this.logger.log(
      `[Cron] Found ${tasks.length} task(s) due today — enqueuing reminders...`,
    );

    for (const task of tasks) {
      const assignedEmails = task.assignedTo
        .map((u) => u.email)
        .filter(Boolean);

      if (assignedEmails.length === 0) {
        this.logger.debug(
          `[Cron] Task "${task.title}" has no assigned users — skipping.`,
        );
        continue;
      }

      const payload: TaskReminderPayload = {
        taskId: task._id.toString(),
        taskTitle: task.title,
        dueDate: task.dueDate.toISOString().slice(0, 10),
        organizationId: task.organization._id.toString(),
        organizationName: task.organization.name ?? 'Unknown Organization',
        assignedEmails,
      };

      await this.taskReminderQueue.add('send-reminder', payload, {
        removeOnComplete: true,
        removeOnFail: 50,
      });

      this.logger.debug(
        `[Cron] Enqueued reminder for Task: "${task.title}" → ${assignedEmails.join(', ')}`,
      );
    }
  }
}
