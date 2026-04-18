import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { OrgPlan } from '../schemas/organization.schema';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty({ message: 'Organization name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @IsOptional()
  @IsUrl({}, { message: 'logoUrl must be a valid URL' })
  logoUrl?: string;

  @IsOptional()
  @IsEnum(OrgPlan, { message: 'plan must be one of: free, pro, enterprise' })
  plan?: OrgPlan;
}
