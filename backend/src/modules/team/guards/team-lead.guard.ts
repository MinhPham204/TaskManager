import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team, TeamDocument, TeamMemberRole } from '../schemas/team.schema';
import { UserRole } from '../../user/schemas/user.schema';

/**
 * Guard lớp 1 cho nhóm API quản trị Team.
 * Cho phép ORG_OWNER, ORG_ADMIN hoặc TEAM_LEAD của chính team đó.
 */
@Injectable()
export class TeamLeadGuard implements CanActivate {
  constructor(
    @InjectModel(Team.name)
    private readonly teamModel: Model<TeamDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { _id?: string; role?: UserRole };
    const teamId = request.params.id;

    if (!user?._id) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!teamId) {
      throw new ForbiddenException('Team ID not provided');
    }

    // ORG cấp hạ tầng: cho phép quản trị toàn bộ Team trong org.
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      return true;
    }

    const team = await this.teamModel.findById(teamId).select('members');
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const userObjectId = new Types.ObjectId(user._id.toString());
    const isTeamLead = team.members.some(
      (member) =>
        member.user.equals(userObjectId) && member.role === TeamMemberRole.LEAD,
    );

    if (!isTeamLead) {
      throw new ForbiddenException('Only TEAM_LEAD can manage this team');
    }

    return true;
  }
}
