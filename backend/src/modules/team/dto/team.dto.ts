import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TeamMemberRole } from '../schemas/team.schema';

export class PaginationDto {
  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class CreateTeamDto {
  /** Tên team (phải unique trong org) */
  @ApiProperty({ example: 'Frontend Squad' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  /** Mô tả team */
  @ApiPropertyOptional({ example: 'Responsible for all UI components' })
  @IsOptional()
  @IsString()
  description?: string;

  /** URL logo team */
  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  /**
   * Optional: chỉ định user làm TEAM_LEAD ngay khi tạo Team.
   * Nếu bỏ trống, người tạo sẽ là TEAM_LEAD mặc định.
   */
  @ApiPropertyOptional({ example: '6630a1b2c3d4e5f6a7b8c9d0' })
  @IsOptional()
  @IsString()
  leadUserId?: string;
}

export class UpdateTeamDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}

export class AddMemberDto {
  /** ID của user cần thêm (phải thuộc cùng Organization) */
  @ApiProperty({ example: '6630a1b2c3d4e5f6a7b8c9d0' })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

export class InviteMemberDto {
  /** Email của người được mời */
  @ApiProperty({ example: 'dev@company.com' })
  @IsString()
  @IsNotEmpty()
  email!: string;

  /** Role khi gia nhập team */
  @ApiPropertyOptional({ enum: TeamMemberRole, default: TeamMemberRole.MEMBER })
  @IsOptional()
  @IsEnum(TeamMemberRole)
  role?: TeamMemberRole;
}
