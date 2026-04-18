import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

// Omit password and organization từ update DTO
// (password thay đổi qua endpoint riêng, organization không được đổi)
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'organization'] as const),
) {
  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
