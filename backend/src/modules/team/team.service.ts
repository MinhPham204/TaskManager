import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { Team, TeamMemberRole, TeamDocument } from './schemas/team.schema';
import { User, UserDocument, UserRole } from '../user/schemas/user.schema';
import { TenantStorageService } from '../../common/als/tenant-storage.service';
import {
  CreateTeamDto,
  UpdateTeamDto,
  AddMemberDto,
  InviteMemberDto,
  PaginationDto,
} from './dto/team.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TeamActor {
  userId: string;
  orgRole: UserRole;
}

@Injectable()
export class TeamService {
  constructor(
    @InjectModel(Team.name) private readonly teamModel: Model<TeamDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly tenantStorage: TenantStorageService,
  ) {}

  private normalizePagination(pagination?: PaginationDto) {
    const page = Math.max(1, Number(pagination?.page ?? 1));
    const limit = Math.max(1, Math.min(100, Number(pagination?.limit ?? 10)));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }

  /**
   * Lớp phòng thủ 2 cho nhóm quản trị Team.
   * Cho phép ORG_OWNER/ORG_ADMIN hoặc TEAM_LEAD của chính team đó.
   */
  private async ensureTeamAdminAccess(
    teamId: string,
    currentUser: TeamActor,
  ): Promise<TeamDocument> {
    const team = await this.teamModel.findById(teamId).select('members');
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (
      currentUser.orgRole === UserRole.OWNER ||
      currentUser.orgRole === UserRole.ADMIN
    ) {
      return team;
    }

    const currentUserObjectId = new Types.ObjectId(currentUser.userId);
    const isTeamLead = team.members.some(
      (member) =>
        member.user.equals(currentUserObjectId) &&
        member.role === TeamMemberRole.LEAD,
    );

    if (isTeamLead) {
      return team;
    }

    throw new ForbiddenException('Bạn không có quyền quản trị Team này');
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────────
  async create(dto: CreateTeamDto, currentUser: TeamActor): Promise<TeamDocument> {
    // Đảm bảo user thuộc org trước khi tạo → lỗi rõ ràng thay vì Mongoose ValidationError
    const orgId = this.tenantStorage.requireOrganizationId();

    if (
      currentUser.orgRole !== UserRole.OWNER &&
      currentUser.orgRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only ORG_OWNER or ORG_ADMIN can create team');
    }

    const leadUserId = dto.leadUserId ?? currentUser.userId;
    const leadObjectId = new Types.ObjectId(leadUserId);

    // Nếu chỉ định lead khác người tạo, phải chắc chắn user đó thuộc cùng organization.
    if (dto.leadUserId) {
      const leadUser = await this.userModel
        .findOne({
          _id: leadObjectId,
          organization: new Types.ObjectId(orgId),
          isActive: true,
        })
        .select('_id');

      if (!leadUser) {
        throw new NotFoundException(
          'Lead user not found in your organization',
        );
      }
    }

    const { leadUserId: _leadUserId, ...teamPayload } = dto;

    const team = new this.teamModel({
      ...teamPayload,
      members: [
        {
          user: leadObjectId,
          role: TeamMemberRole.LEAD,
        },
      ],
      // organization: KHÔNG set — plugin tự inject qua pre('validate')
    });

    try {
      return await team.save();
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          `Team with name "${dto.name}" already exists in your organization`,
        );
      }
      throw error;
    }
  }

  // ─── READ ─────────────────────────────────────────────────────────────────────
  async findAll(
    pagination?: PaginationDto,
  ): Promise<PaginatedResult<TeamDocument>> {
    const { page, limit, skip } = this.normalizePagination(pagination);
    const filter = {};

    const [data, total] = await Promise.all([
      this.teamModel
        .find(filter)
        .populate('members.user', 'name email profileImageUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.teamModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string, currentUser: TeamActor): Promise<TeamDocument> {
    const team = await this.teamModel
      .findById(id)
      .populate('members.user', 'name email profileImageUrl')
      .populate('pendingInvitations');

    if (!team) throw new NotFoundException('Team not found');

    // TEAM_MEMBER chỉ xem team của mình. ORG_ADMIN/ORG_OWNER xem toàn bộ team trong org.
    if (
      currentUser.orgRole !== UserRole.OWNER &&
      currentUser.orgRole !== UserRole.ADMIN
    ) {
      const currentUserObjectId = new Types.ObjectId(currentUser.userId);
      const isTeamMember = team.members.some((member) =>
        member.user._id
          ? member.user._id.equals(currentUserObjectId)
          : member.user.equals(currentUserObjectId),
      );

      if (!isTeamMember) {
        throw new ForbiddenException('You cannot access this team');
      }
    }

    return team;
  }

  async getMyTeams(
    userId: string,
    pagination?: PaginationDto,
  ): Promise<PaginatedResult<TeamDocument>> {
    const userObjectId = new Types.ObjectId(userId);
    const { page, limit, skip } = this.normalizePagination(pagination);

    const filter = { 'members.user': userObjectId };

    const [data, total] = await Promise.all([
      this.teamModel
        .find(filter)
        .populate('members.user', 'name email profileImageUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.teamModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────────
  async update(
    id: string,
    dto: UpdateTeamDto,
    currentUser: TeamActor,
  ): Promise<TeamDocument> {
    await this.ensureTeamAdminAccess(id, currentUser);

    const team = await this.teamModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      { $set: dto },
      { new: true, runValidators: true },
    );
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  // ─── MEMBER MANAGEMENT ────────────────────────────────────────────────────────
  /**
   * Thêm thành viên vào team.
   * Đảm bảo SaaS Multi-tenancy: chỉ cho phép thêm nếu user thuộc cùng Organization.
   *
   * Cơ chế: Plugin auto-inject org filter vào userModel.findById()
   * → Nếu userId thuộc org khác, query trả null → NotFoundException
   * → Không cần truyền orgId thủ công!
   */
  async addMember(
    teamId: string,
    dto: AddMemberDto,
    currentUser: TeamActor,
  ): Promise<TeamDocument> {
    await this.ensureTeamAdminAccess(teamId, currentUser);

    const currentOrgId = this.tenantStorage.getOrganizationId();

    if (!currentOrgId) {
    throw new UnauthorizedException('Không tìm thấy ngữ cảnh Tổ chức (Organization Context). Vui lòng đăng nhập lại.');
  }

    const user = await this.userModel.findOne({
      _id: new Types.ObjectId(dto.userId),
      organization: new Types.ObjectId(currentOrgId)
    }).select('_id name');    
    
    if (!user) {
      throw new NotFoundException(
        'User not found in your organization. Cannot add members from a different organization.',
      );
    }

    const userId = new Types.ObjectId(dto.userId);
    const updated = await this.teamModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(teamId),
        'members.user': { $ne: userId },
      },
      {
        $push: {
          members: {
            user: userId,
            role: TeamMemberRole.MEMBER,
          },
        },
      },
      { new: true },
    );

    if (updated) {
      return updated;
    }

    const teamExists = await this.teamModel.exists({ _id: new Types.ObjectId(teamId) });
    if (!teamExists) {
      throw new NotFoundException('Team not found');
    }

    throw new ConflictException('User is already a member of this team');
  }

  async removeMember(
    teamId: string,
    memberId: string,
    currentUser: TeamActor,
  ): Promise<TeamDocument> {
    const team = await this.ensureTeamAdminAccess(teamId, currentUser);

    const memberObjectId = new Types.ObjectId(memberId);
    const targetMember = team.members.find((m) => m.user.equals(memberObjectId));
    if (!targetMember) {
      throw new NotFoundException('Member not found in team');
    }

    if (targetMember.role === TeamMemberRole.LEAD) {
      const leadCount = team.members.filter(
        (m) => m.role === TeamMemberRole.LEAD,
      ).length;

      // TEAM_LEAD không được tự loại mình nếu họ là LEAD cuối cùng.
      const isSelfRemoval = memberObjectId.equals(new Types.ObjectId(currentUser.userId));
      const actorIsInfraAdmin =
        currentUser.orgRole === UserRole.OWNER ||
        currentUser.orgRole === UserRole.ADMIN;

      if (isSelfRemoval && !actorIsInfraAdmin && leadCount <= 1) {
        throw new ForbiddenException(
          'Cannot remove yourself as the last team lead',
        );
      }
    }

    const updatedTeam = await this.teamModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(teamId),
        'members.user': memberObjectId,
      },
      {
        $pull: {
          members: { user: memberObjectId },
        },
      },
      { new: true },
    );

    if (!updatedTeam) {
      throw new NotFoundException('Team not found');
    }

    return updatedTeam;
  }

  async promoteToLead(
    teamId: string,
    memberId: string,
    currentUser: TeamActor,
  ): Promise<TeamDocument> {
    await this.ensureTeamAdminAccess(teamId, currentUser);

    const teamObjectId = new Types.ObjectId(teamId);
    const memberObjectId = new Types.ObjectId(memberId);

    const team = await this.teamModel.findById(teamObjectId).select('members');
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const targetMember = team.members.find((m) => m.user.equals(memberObjectId));
    if (!targetMember) {
      throw new NotFoundException('User is not a member of this team');
    }

    if (targetMember.role !== TeamMemberRole.MEMBER) {
      throw new ConflictException('Only TEAM_MEMBER can be promoted to TEAM_LEAD');
    }

    const isMember = await this.teamModel.exists({
      _id: teamObjectId,
      'members.user': memberObjectId,
    });
    if (!isMember) {
      throw new NotFoundException('User is not a member of this team');
    }

    await this.teamModel.updateOne(
      {
        _id: teamObjectId,
        members: {
          $elemMatch: {
            user: memberObjectId,
            role: { $ne: TeamMemberRole.LEAD },
          },
        },
      },
      {
        $set: {
          'members.$[target].role': TeamMemberRole.LEAD,
        },
      },
      {
        arrayFilters: [{ 'target.user': memberObjectId }],
      },
    );

    return this.findById(teamId, currentUser);
  }

  // ─── INVITATION ────────────────────────────────────────────────────────────────
  async inviteMember(
    teamId: string,
    dto: InviteMemberDto,
    currentUser: TeamActor,
  ): Promise<TeamDocument> {
    await this.ensureTeamAdminAccess(teamId, currentUser);

    const normalizedEmail = dto.email.trim().toLowerCase();

    // Kiểm tra user theo email đã là thành viên chính thức của team chưa
    const invitedUser = await this.userModel
      .findOne({ email: normalizedEmail })
      .select('_id');
    if (invitedUser) {
      const alreadyMember = await this.teamModel.exists({
        _id: new Types.ObjectId(teamId),
        'members.user': invitedUser._id,
      });

      if (alreadyMember) {
        throw new ConflictException(`${normalizedEmail} is already a team member`);
      }
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Tìm và xóa lời mời của email này NẾU nó đã quá hạn (expiresAt < now)
    await this.teamModel.updateOne(
      { _id: new Types.ObjectId(teamId) },
      { 
        $pull: { 
          pendingInvitations: { 
            email: normalizedEmail, 
            expiresAt: { $lt: new Date() } 
          } 
        } 
      }
    );

    const updatedTeam = await this.teamModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(teamId),
        'pendingInvitations.email': { $ne: normalizedEmail },
      },
      {
        $push: {
          pendingInvitations: {
            email: normalizedEmail,
            role: dto.role ?? TeamMemberRole.MEMBER,
            token,
            expiresAt,
          },
        },
      },
      { new: true },
    );

    if (updatedTeam) {
      return updatedTeam;
    }

    const teamExists = await this.teamModel.exists({ _id: new Types.ObjectId(teamId) });
    if (!teamExists) {
      throw new NotFoundException('Team not found');
    }

    throw new ConflictException(`${normalizedEmail} has already been invited`);
  }

  async cancelInvitation(
    teamId: string,
    email: string,
    currentUser: TeamActor,
  ): Promise<TeamDocument> {
    await this.ensureTeamAdminAccess(teamId, currentUser);

    const normalizedEmail = email.trim().toLowerCase();

    // Dùng $pull để xóa toàn bộ dữ liệu xác thực lời mời (email, token, expiresAt),
    // giúp link mời đã gửi trước đó bị vô hiệu hóa ngay lập tức.
    const team = await this.teamModel.findOneAndUpdate(
      { _id: new Types.ObjectId(teamId) },
      { $pull: { pendingInvitations: { email: normalizedEmail } } },
      { new: true },
    );
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────────
  async delete(id: string, currentUser: TeamActor): Promise<{ message: string }> {
    await this.ensureTeamAdminAccess(id, currentUser);

    const result = await this.teamModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
    });
    if (!result) throw new NotFoundException('Team not found');
    return { message: 'Team deleted successfully' };
  }
}
