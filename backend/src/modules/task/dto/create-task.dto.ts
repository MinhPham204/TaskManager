import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { TaskPriority } from '../schemas/task.schema';

export class CreateTaskDto {
  /** Tiêu đề task */
  @ApiProperty({ example: 'Design landing page' })
  @IsString()
  @IsNotEmpty()
  title: string;

  /** Mô tả chi tiết task */
  @ApiProperty({ example: 'Create wireframes and mockups' })
  @IsString()
  @IsNotEmpty()
  description: string;

  /** Độ ưu tiên */
  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  /** Hạn hoàn thành (ISO 8601) */
  @ApiProperty({ example: '2026-05-01' })
  @IsDateString()
  dueDate: string;

  /** Danh sách User IDs được giao task */
  @ApiPropertyOptional({ type: [String], example: ['6630a1...', '6630a2...'] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  assignedTo?: string[];

  /** Team ID mà task thuộc về */
  @ApiProperty({ example: '6630a3...' })
  @IsMongoId()
  @IsNotEmpty()
  team: string;
}
