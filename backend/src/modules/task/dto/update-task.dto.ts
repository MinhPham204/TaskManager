import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TaskStatus } from '../schemas/task.schema';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class UpdateTaskStatusDto {
  /** Trạng thái mới của task */
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}

export class AddTodoItemDto {
  /** Nội dung todo item */
  @ApiPropertyOptional({ example: 'Review design with team' })
  @IsString()
  text!: string;
}

export class UpdateProgressDto {
  /** Tiến độ từ 0–100 */
  @ApiPropertyOptional({ minimum: 0, maximum: 100, example: 75 })
  @IsInt()
  @Min(0)
  @Max(100)
  progress!: number;
}

export class RejectTaskDto {
  /** Lý do từ chối (optional — Admin có thể ghi chú cho Member) */
  @ApiPropertyOptional({
    example: 'Please fix the UI bugs before resubmitting.',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
