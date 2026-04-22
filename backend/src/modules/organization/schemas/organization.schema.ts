import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
import * as crypto from 'crypto';

export type OrganizationDocument = HydratedDocument<Organization>;

export enum OrgPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

@Schema({ _id: false })
export class OrgPendingInvitation {
  @ApiProperty({ example: 'user@example.com' })
  @Prop({ type: String, required: true })
  email!: string;

  @ApiProperty({ example: 'member', default: 'member' })
  @Prop({ type: String, default: 'member' })
  role!: string;

  @ApiProperty({ example: '2026-04-13T10:00:00.000Z' })
  @Prop({ type: Date, default: () => new Date() })
  invitedAt!: Date;
}
export const OrgPendingInvitationSchema = SchemaFactory.createForClass(
  OrgPendingInvitation,
);

@Schema({ timestamps: true })
export class Organization {
  @Prop({
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    unique: true,
  })
  name: string;

  @Prop({
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  })
  slug: string;

  @Prop({ type: String, default: null })
  logoUrl: string | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  owner: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  members: Types.ObjectId[];

  @Prop({ type: [OrgPendingInvitationSchema], default: [] })
  pendingInvitations: OrgPendingInvitation[];

  @Prop({
    type: String,
    enum: Object.values(OrgPlan),
    default: OrgPlan.FREE,
  })
  plan: OrgPlan;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

OrganizationSchema.pre('save', async function () {
  if (this.isNew || this.isModified('name')) {
    const baseSlug = (this.name as string)
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const randomSuffix = crypto.randomBytes(3).toString('hex');
    
    this.slug = baseSlug ? `${baseSlug}-${randomSuffix}` : `org-${randomSuffix}`;
  }
});

OrganizationSchema.index({ isActive: 1, owner: 1 });
OrganizationSchema.index({ isActive: 1, members: 1 });
OrganizationSchema.index({ "pendingInvitations.email": 1 });
