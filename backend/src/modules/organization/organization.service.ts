import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import {
  Organization,
  OrganizationDocument,
} from './schemas/organization.schema';
import { User, UserDocument, UserRole } from '../user/schemas/user.schema';
import { EmailService } from '../../common/services/email.service';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectModel(Organization.name)
    private readonly orgModel: Model<OrganizationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly emailService: EmailService,
  ) {}

  private async getActorAndOrganization(
    orgId: string,
    currentUserId: string,
  ): Promise<{ org: OrganizationDocument; actor: UserDocument; isOwner: boolean }> {
    const org = await this.orgModel.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organization with id "${orgId}" not found`);
    }

    const actor = await this.userModel.findById(currentUserId);
    if (!actor) {
      throw new NotFoundException(`User with id "${currentUserId}" not found`);
    }

    const actorObjectId = new Types.ObjectId(currentUserId);
    const belongsToOrg =
      actor.organization?.toString() === org._id.toString() &&
      (org.owner.equals(actorObjectId) ||
        org.members.some((memberId) => memberId.equals(actorObjectId)));

    if (!belongsToOrg) {
      throw new ForbiddenException('You do not belong to this organization');
    }

    return { org, actor, isOwner: org.owner.equals(actorObjectId) };
  }

  async findById(id: string): Promise<OrganizationDocument> {
    const org = await this.orgModel.findById(id).populate('owner', '-password');
    if (!org) {
      throw new NotFoundException(`Organization with id "${id}" not found`);
    }
    return org;
  }

  async findBySlug(slug: string): Promise<OrganizationDocument> {
    const org = await this.orgModel
      .findOne({ slug })
      .populate('owner', '-password');
    if (!org) {
      throw new NotFoundException(
        `Organization with slug "${slug}" not found`,
      );
    }
    return org;
  }

  async findAll(currentUserId: string): Promise<OrganizationDocument[]> {
    const userObjectId = new Types.ObjectId(currentUserId);
    return this.orgModel
      .find({
        isActive: true,
        $or: [{ owner: userObjectId }, { members: userObjectId }],
      })
      .populate('owner', '-password');
  }

  /**
   * Update organization 
   * Chỉ cho phép Owner của tổ chức đó mới được quyền cập nhật thông tin tổ chức (multi-tenancy isolation).
   * @param id Organization ID
   * @param dto Update data
   * @param currentUserId User ID making the request (must be owner)
   * @returns Updated organization document
   */
  async update(
    id: string,
    dto: UpdateOrganizationDto,
    currentUserId?: string,
  ): Promise<OrganizationDocument> {
    // Find organization
    const org = await this.orgModel.findById(id);
    if (!org) {
      throw new NotFoundException(`Organization with id "${id}" not found`);
    }

    // Nếu currentUserId được cung cấp, kiểm tra xem user đó có phải là owner của tổ chức không
    if (currentUserId) {
      const userObjectId = new Types.ObjectId(currentUserId);
      const isOwner = org.owner.equals(userObjectId);

      if (!isOwner) {
        throw new ConflictException(
          'Only the organization owner can update organization information',
        );
      }
    }

    // Update organization with validation
    const updatedOrg = await this.orgModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true, runValidators: true },
    ).populate('owner', '-password');

    if (!updatedOrg) {
      throw new NotFoundException(`Organization with id "${id}" not found`);
    }

    return updatedOrg;
  }

  /**
   * Add member by email - creates pending invitation
   * @param orgId Organization ID
   * @param email User email to invite
   * @param role Optional role (default: member)
   * @returns Updated organization document
   */
  async addMember(
    orgId: string,
    email: string,
    role: string = 'member',
    currentUserId?: string,
  ): Promise<OrganizationDocument> {
    if (currentUserId) {
      const { actor, isOwner } = await this.getActorAndOrganization(orgId, currentUserId);
      const isAdmin = actor.role === UserRole.ADMIN;
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          'Only ORG_OWNER or ORG_ADMIN can add members',
        );
      }
    }

    const org = await this.orgModel.findById(orgId).populate('owner', 'name email');
    if (!org) {
      throw new NotFoundException(`Organization with id "${orgId}" not found`);
    }

    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new NotFoundException(`User with email "${email}" not found`);
    }

    if (user.organization && !user.organization.equals(new Types.ObjectId(orgId))) {
      throw new ConflictException(
        `User "${email}" already belongs to another organization and cannot be added to this one.`,
      );
    }

    // Check if user already in organization members
    const alreadyMember = org.members.some((memberId) =>
      memberId.equals(user._id),
    );
    if (alreadyMember) {
      throw new ConflictException(
        `User "${email}" is already a member of this organization`,
      );
    }

    // Check if already has pending invitation
    const alreadyInvited = org.pendingInvitations.some(
      (inv) => inv.email.toLowerCase() === email.toLowerCase(),
    );
    if (alreadyInvited) {
      throw new ConflictException(
        `User "${email}" already has a pending invitation to this organization`,
      );
    }

    // Thêm vào pending invitation trước để đảm bảo atomicity (nếu email gửi thất bại vẫn có thể retry)
    const updatedOrg = await this.orgModel.findByIdAndUpdate(
      orgId,
      { $push: { pendingInvitations: { email: email.toLowerCase(), role } } },
      { new: true },
    );

    if (!updatedOrg) {
      throw new NotFoundException(`Organization with id "${orgId}" not found`);
    }

    // Gưi email mời tham gia tổ chức
    try {
      const ownerName = (org.owner as any)?.name || 'Team Member';
      await this.emailService.sendOrganizationInvitationEmail({
        to: user.email,
        organizationName: org.name,
        organizationId: org._id.toString(),
        invitedByName: ownerName,
        acceptLink: `${process.env.CLIENT_URL}/organizations/${org._id}/accept-invite`,
      });
    } catch (error) {
      // Log error but don't fail the operation
      console.error(
        `Failed to send invitation email to ${user.email}:`,
        error,
      );
    }

    return updatedOrg;
  }

 /**
   * Accept organization invitation (Strict B2B Model)
   * 1 User - 1 Organization, không cho phép chuyển org
   */
  async acceptInvitation(
    orgId: string,
    userId: string,
  ): Promise<OrganizationDocument> {
    const newOrg = await this.orgModel.findById(orgId);
    if (!newOrg) {
      throw new NotFoundException(`Organization with id "${orgId}" not found`);
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    // 1. Verify pending invitation exists
    const pendingInvIndex = newOrg.pendingInvitations.findIndex(
      (inv) => inv.email.toLowerCase() === user.email.toLowerCase(),
    );

    if (pendingInvIndex === -1) {
      throw new NotFoundException(
        `No pending invitation found for user "${user.email}" in this organization`,
      );
    }

    // 2. Verify not already a member of new org
    const alreadyInNewOrg = newOrg.members.some((memberId) =>
      memberId.equals(user._id),
    );
    if (alreadyInNewOrg) {
      throw new ConflictException(
        'You are already a member of this organization',
      );
    }

    const invitedRole = newOrg.pendingInvitations[pendingInvIndex].role;

    // STRICT B2B CHECK
    // Nếu user đã thuộc về một công ty khác (organization khác null và khác orgId mới)
    if (user.organization && !user.organization.equals(newOrg._id)) {
      throw new ForbiddenException(
        'You already belong to another organization and cannot accept this invitation. Please contact support if you need assistance.',
      );
    }

    // Join new organization
    // Remove from pending invitations and add to members
    const updatedNewOrg = await this.orgModel.findByIdAndUpdate(
      orgId,
      {
        $pull: { pendingInvitations: { email: user.email.toLowerCase() } },
        $addToSet: { members: user._id },
      },
      { new: true },
    );

    if (!updatedNewOrg) {
      throw new NotFoundException(`Organization with id "${orgId}" not found`);
    }

    // Update user: set new organization and role
    await this.userModel.findByIdAndUpdate(userId, {
      $set: {
        organization: new Types.ObjectId(orgId),
        role: invitedRole,
        isActive: true, // Đảm bảo tài khoản được kích hoạt nếu trước đó là tài khoản mới tạo
      },
    });

    return updatedNewOrg;
  }

  /**
   * Update member role in organization
   * Chỉ ORG_OWNER hoặc ORG_ADMIN mới có quyền thay đổi role của thành viên khác (không được phép thay đổi role của chính mình)
   * @param orgId Organization ID
   * @param userId User ID whose role to update
   * @param newRole New role ('admin' or 'member')
   * @param currentUserId The user making the request (must be owner)
   * @returns Updated organization document
   */
  async updateMemberRole(
    orgId: string,
    userId: string,
    newRole: string,
    currentUserId: string,
  ): Promise<OrganizationDocument> {
    const { org, actor, isOwner } = await this.getActorAndOrganization(
      orgId,
      currentUserId,
    );
    const isAdmin = actor.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Only ORG_OWNER or ORG_ADMIN can update member roles',
      );
    }

    if (newRole !== 'admin' && newRole !== 'member') {
      throw new BadRequestException('Role must be either "admin" or "member"');
    }

    // Convert to ObjectId for comparison
    const userObjectId = new Types.ObjectId(userId);
    const currentUserObjectId = new Types.ObjectId(currentUserId);

    // Prevent user from changing their own role
    if (userObjectId.equals(currentUserObjectId)) {
      throw new ConflictException(
        'You cannot change your own role. Please contact another administrator.',
      );
    }

    // Verify user is actually a member of this organization
    const isMember = org.members.some((memberId) =>
      memberId.equals(userObjectId),
    );
    if (!isMember) {
      throw new NotFoundException(
        `User with id "${userId}" is not a member of this organization`,
      );
    }

    const targetUser = await this.userModel.findById(userId).select('_id role organization');
    if (!targetUser) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    if (targetUser.organization?.toString() !== org._id.toString()) {
      throw new ForbiddenException('Target user does not belong to this organization');
    }

    // Defense layer: ORG_ADMIN cannot downgrade ORG_OWNER
    if (isAdmin && targetUser.role === UserRole.OWNER) {
      throw new ForbiddenException(
        'ORG_ADMIN cannot change role of ORG_OWNER',
      );
    }

    const mappedRole =
      newRole === 'admin' ? UserRole.ADMIN : UserRole.MEMBER;

    // Update user role
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { role: mappedRole } },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    // Return updated organization
    const updatedOrg = await this.orgModel.findById(orgId);
    if (!updatedOrg) {
      throw new NotFoundException(`Organization with id "${orgId}" not found`);
    }
    return updatedOrg;
  }

  /**
   * Get pending invitations for a user
   * @param userId User ID
   * @returns Array of organizations with pending invitations for this user
   */
  async getPendingInvitations(userId: string): Promise<any[]> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    // Find all organizations that have pending invitation for this user's email
    const organizations = await this.orgModel
      .find({ 'pendingInvitations.email': user.email.toLowerCase() })
      .populate('owner', 'name email')
      .lean();

    // Filter to only include pending invitations for this user's email
    return organizations.map((org: any) => ({
      ...org,
      pendingInvitations: org.pendingInvitations.filter(
        (inv: any) => inv.email.toLowerCase() === user.email.toLowerCase(),
      ),
    }));
  }

  /**
   * Remove member from organization
   * @param orgId Organization ID
   * @param userId User ID to remove
   * @returns Updated organization document
   */
  async removeMember(
    orgId: string,
    userId: string,
    currentUserId?: string,
  ): Promise<OrganizationDocument> {
    if (!currentUserId) {
      throw new ForbiddenException('Current user context is required');
    }

    const { org, actor, isOwner } = await this.getActorAndOrganization(
      orgId,
      currentUserId,
    );
    const isAdmin = actor.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Only ORG_OWNER or ORG_ADMIN can remove members',
      );
    }

    const memberObjectId = new Types.ObjectId(userId);

    const targetUser = await this.userModel.findById(memberObjectId).select('_id role organization');
    if (!targetUser) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    if (targetUser.organization?.toString() !== org._id.toString()) {
      throw new ForbiddenException('Target user does not belong to this organization');
    }

    // Check if user is organization owner - cannot remove owner
    const targetIsOwner = org.owner.equals(memberObjectId);
    if (targetIsOwner) {
      throw new ConflictException(
        'Cannot remove organization owner from organization',
      );
    }

    // Defense layer: ORG_ADMIN cannot remove ORG_OWNER
    if (isAdmin && targetUser.role === UserRole.OWNER) {
      throw new ForbiddenException('ORG_ADMIN cannot remove ORG_OWNER');
    }

    // Check if user is actually a member
    const isMember = org.members.some((memberId) =>
      memberId.equals(memberObjectId),
    );
    if (!isMember) {
      throw new NotFoundException(
        `User with id "${userId}" is not a member of this organization`,
      );
    }

    // Remove user from organization members
    const updatedOrg = await this.orgModel.findByIdAndUpdate(
      orgId,
      { $pull: { members: memberObjectId } },
      { new: true },
    );

    if (!updatedOrg) {
      throw new NotFoundException(`Organization with id "${orgId}" not found`);
    }

    // Clear organization reference from user
    await this.userModel.findByIdAndUpdate(memberObjectId, {
      $set: { isActive: false },
    });

    return updatedOrg;
  }

  async deactivate(
    id: string,
    currentUserId?: string,
  ): Promise<OrganizationDocument> {
    return this.update(id, { isActive: false }, currentUserId);
  }
}
