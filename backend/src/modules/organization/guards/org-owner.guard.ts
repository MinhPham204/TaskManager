import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
} from '../schemas/organization.schema';

/**
 * Guard để kiểm tra user có phải là Owner của organization không.
 * Chỉ organization owner mới được add/remove members.
 */
@Injectable()
export class OrgOwnerGuard implements CanActivate {
  constructor(
    @InjectModel(Organization.name)
    private readonly orgModel: Model<OrganizationDocument>,
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

    const org = await this.orgModel.findById(orgId).lean();
    if (!org) {
      throw new NotFoundException(`Organization with id "${orgId}" not found`);
    }

    // So sánh user._id với org.owner
    const userId = new Types.ObjectId(user._id.toString());
    const ownerId = new Types.ObjectId(org.owner.toString());

    if (!userId.equals(ownerId)) {
      throw new ForbiddenException(
        'Only organization owner can perform this action',
      );
    }

    return true;
  }
}
