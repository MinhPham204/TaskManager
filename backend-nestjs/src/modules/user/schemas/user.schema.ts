import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  OWNER = 'ORG_OWNER',
  ADMIN = 'ORG_ADMIN',
  MEMBER = 'ORG_MEMBER',
}

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  })
  name!: string;

  @Prop({
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({
    type: String,
    required: [true, 'Password is required'],
  })
  password!: string;

  @Prop({ type: String, default: null })
  profileImageUrl!: string | null;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.MEMBER,
  })
  role!: UserRole;

  @Prop({
    type: Types.ObjectId,
    ref: 'Team',
    default: null,
  })
  team!: Types.ObjectId | null;

  /**
   * SaaS Multi-tenancy: Tổ chức mà user thuộc về.
   * required: true — mỗi user phải gắn với một Organization.
   */
 @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'], // Bắt buộc phải có Org
  })
  organization!: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  isActive:boolean;

  @Prop({ type: String, default: null, select: false })
  refreshToken!: string | null;
 }

export const UserSchema = SchemaFactory.createForClass(User);
