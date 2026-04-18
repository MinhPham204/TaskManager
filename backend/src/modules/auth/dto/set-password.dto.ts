import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPasswordDto {
  @ApiProperty({ description: 'Mật khẩu mới' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: 'Họ và tên người dùng' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ description: 'Tên tổ chức/đội nhóm' }) 
  @IsString()
  @IsNotEmpty()
  organizationName!: string;
}