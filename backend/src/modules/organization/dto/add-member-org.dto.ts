import { IsEmail, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OrgMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export class AddMemberOrgDto {
  @ApiProperty({
    description: 'Email of user to add to organization',
    example: 'member@company.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Role for the new member',
    enum: OrgMemberRole,
    default: OrgMemberRole.MEMBER,
    required: false,
  })
  @IsOptional()
  @IsEnum(OrgMemberRole)
  role?: OrgMemberRole = OrgMemberRole.MEMBER;
}

export class UpdateMemberRoleDto {
  @ApiProperty({
    enum: OrgMemberRole,
    description: 'New role for the member (admin or member)',
    example: OrgMemberRole.ADMIN,
  })
  @IsEnum(OrgMemberRole, {
    message: 'Role must be either "admin" or "member"',
  })
  @IsNotEmpty()
  role!: OrgMemberRole;
}
