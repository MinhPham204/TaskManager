import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsMongoId({ message: 'organization must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Organization is required' })
  organization: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: `role must be one of: ${Object.values(UserRole).join(', ')}`,
  })
  role?: UserRole;

  @IsOptional()
  @IsUrl({}, { message: 'profileImageUrl must be a valid URL' })
  profileImageUrl?: string;
}
