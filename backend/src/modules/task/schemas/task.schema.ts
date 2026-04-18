import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export enum TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  PENDING_APPROVAL = 'Pending Approval', // Giai đoạn 5: Member nộp task chờ duyệt
  REJECTED = 'Rejected', // Giai đoạn 5: Admin/Owner từ chối
}

// ─── Sub-document: TodoItem ───────────────────────────────────────────────────
@Schema({ _id: true })
export class TodoItem {
  _id?: Types.ObjectId; // Mongoose tự tạo _id cho subdocument

  @ApiProperty()
  @Prop({ type: String, required: true })
  text!: string;

  @ApiProperty({ default: false })
  @Prop({ type: Boolean, default: false })
  completed!: boolean;
}
export const TodoItemSchema = SchemaFactory.createForClass(TodoItem);

// ─── Main Schema ──────────────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Task {
  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({
    type: String,
    enum: Object.values(TaskPriority),
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Prop({
    type: String,
    enum: Object.values(TaskStatus),
    default: TaskStatus.PENDING,
  })
  status!: TaskStatus;

  @Prop({ type: Date, required: true })
  dueDate!: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  assignedTo!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy!: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  attachments!: string[];

  @Prop({ type: [TodoItemSchema], default: [] })
  todoCheckList!: TodoItem[];

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  progress!: number;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  team!: Types.ObjectId;

  /** Tự động inject bởi TenantPlugin — KHÔNG truyền thủ công */
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organization!: Types.ObjectId;

  /** User đã phê duyệt task. Set khi Admin/Owner approve. */
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  approvedBy!: Types.ObjectId | null;

  /** Lý do từ chối. Set khi Admin/Owner reject. */
  @Prop({ type: String, default: null })
  rejectionReason!: string | null;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
