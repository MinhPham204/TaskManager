import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../../user/schemas/user.schema';
import {
  Organization,
  OrganizationDocument,
} from '../schemas/organization.schema';

/**
 * Guard lớp 1 cho nhóm API quản trị nhân sự Organization.
 * Cho phép ORG_OWNER và ORG_ADMIN thuộc đúng organization thao tác.
 */
@Injectable()
export class OrgAdminGuard implements CanActivate {
  constructor(
    @InjectModel(Organization.name)
    private readonly orgModel: Model<OrganizationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.params.id;

    if (!user || !user._id) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!orgId) {
      throw new ForbiddenException('Organization ID not provided');
    }

    const org = await this.orgModel.findById(orgId).select('_id owner members').lean();
    if (!org) {
      throw new NotFoundException(`Organization with id "${orgId}" not found`);
    }

    const actorId = new Types.ObjectId(user._id.toString());
    const actor = await this.userModel
      .findById(actorId)
      .select('_id role organization')
      .lean();

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const belongsToOrganization =
      actor.organization?.toString() === org._id.toString() &&
      (org.owner.toString() === actorId.toString() ||
        org.members.some((memberId) => memberId.toString() === actorId.toString()));

    if (!belongsToOrganization) {
      throw new ForbiddenException('You do not belong to this organization');
    }

    const isAllowedRole =
      actor.role === UserRole.OWNER || actor.role === UserRole.ADMIN;

    if (!isAllowedRole) {
      throw new ForbiddenException(
        'Only ORG_OWNER or ORG_ADMIN can perform this action',
      );
    }

    return true;
  }
}
