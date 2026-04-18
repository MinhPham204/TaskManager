import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from '../task/schemas/task.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { TASK_REMINDER_QUEUE, NOTIFICATION_QUEUE } from './constants/queues';
import { TaskReminderProducer } from './producers/task-reminder.producer';
import { TaskReminderConsumer } from './consumers/task-reminder.consumer';
import { NotificationConsumer } from './consumers/notification.consumer';

/**
 * AutomationModule — Giai đoạn 4 + 5: Automation & Notifications.
 *
 * Bao gồm:
 * - BullMQ queue 'task-reminder' (Producer + Consumer/Worker) [Stage 4]
 * - BullMQ queue 'notification' (Consumer/Worker) [Stage 5]
 * - Cron Job quét Task có dueDate = hôm nay (mỗi 1 phút)
 * - Worker tái tạo ALS context qua TenantStorageService.run()
 *
 * TenantStorageService + EmailService được inject tự động qua SharedModule (@Global).
 */
@Module({
  imports: [
    // Đăng ký queue 'task-reminder' — Stage 4: Task Due Reminder
    BullModule.registerQueue({
      name: TASK_REMINDER_QUEUE,
    }),

    // Đăng ký queue 'notification' — Stage 5: Approval Request Emails
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE,
    }),

    // Task model: Producer query task theo dueDate
    // User model: NotificationConsumer query admin/owner emails
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [
    TaskReminderProducer,   // Cron Job + Queue Producer (Stage 4)
    TaskReminderConsumer,   // BullMQ Worker: gửi reminder email (Stage 4)
    NotificationConsumer,   // BullMQ Worker: gửi approval-request email (Stage 5)
  ],
})
export class AutomationModule {}
