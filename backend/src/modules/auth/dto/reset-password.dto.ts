import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  newPassword: string;
}
