import { Injectable } from '@nestjs/common';
import { Command } from 'nestjs-command';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { faker } from '@faker-js/faker';

import { Organization, OrganizationDocument } from '../organization/schemas/organization.schema';
import { Team, TeamDocument, TeamMemberRole } from '../team/schemas/team.schema';
import { Task, TaskDocument, TaskPriority, TaskStatus } from '../task/schemas/task.schema';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class SeederCommand {
  constructor(
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {}

  @Command({
    command: 'seed:data',
    describe: 'Tạo mock data số lượng lớn để test performance',
  })
  async seedData() {
    console.log('🚀 Bắt đầu quá trình Seeding Data...');
    
    const ORG_COUNT = 50;
    const USERS_PER_ORG = 20;
    const TEAMS_PER_ORG = 10;
    const TASKS_PER_TEAM = 200;

    // 1. Dọn dẹp CẢ 4 COLLECTION
    console.log('🧹 Đang xóa dữ liệu cũ...');
    await this.orgModel.deleteMany({});
    await this.teamModel.deleteMany({});
    await this.taskModel.deleteMany({});
    await this.userModel.deleteMany({}); // THÊM DÒNG NÀY

    for (let i = 0; i < ORG_COUNT; i++) {
      // ==========================================
      // 1. TẠO SẴN ID CHO ORGANIZATION TRƯỚC
      // ==========================================
      const orgId = new Types.ObjectId();

      const userDocs: any[] = [];
      const orgUserIds: Types.ObjectId[] = [];

      for (let u = 0; u < USERS_PER_ORG; u++) {
        const userId = new Types.ObjectId();
        orgUserIds.push(userId); 

        userDocs.push({
          _id: userId, 
          name: faker.person.fullName(),
          email: faker.internet.email() + `-${faker.string.uuid()}`, 
          password: 'hashed_password_mock_123',
          profileImageUrl: faker.image.avatar(),
          isActive: true,
          organization: orgId, // <--- FIX LỖI: Thêm organization vào đây
        });
      }

      await this.userModel.insertMany(userDocs);
      const ownerId = orgUserIds[0];

      // ==========================================
      // 2. TẠO ORGANIZATION VỚI ID ĐÃ KHỞI TẠO Ở TRÊN
      // ==========================================
      const org = await this.orgModel.create({
        _id: orgId, // <--- Gắn cứng ID để khớp nối với User
        name: faker.company.name() + ` ${faker.string.uuid()}`,
        slug: faker.lorem.slug() + `-${faker.string.uuid()}`,
        owner: ownerId,
        members: orgUserIds,
        plan: 'free',
        isActive: true,
      });

      // 3. Tạo Teams (Lấy ngẫu nhiên từ mảng user có thật)
      const teamDocs: any[] = [];
      for (let j = 0; j < TEAMS_PER_ORG; j++) {
        const teamMembers = faker.helpers.arrayElements(orgUserIds, 5).map(userId => ({
          user: userId,
          role: userId.equals(ownerId) ? TeamMemberRole.LEAD : TeamMemberRole.MEMBER,
        }));

        teamDocs.push({
          name: faker.commerce.department() + ` ${faker.string.uuid()}`,
          description: faker.lorem.sentence(),
          organization: org._id,
          members: teamMembers,
        });
      }
      const teams = await this.teamModel.insertMany(teamDocs);

      // 4. Tạo Tasks
      const taskDocs: any[] = [];
      for (const team of teams) {
        const teamUserIds = team.members.map((m: any) => m.user);

        for (let k = 0; k < TASKS_PER_TEAM; k++) {
          taskDocs.push({
            title: faker.hacker.phrase(),
            description: faker.lorem.paragraph(),
            priority: faker.helpers.enumValue(TaskPriority),
            status: faker.helpers.enumValue(TaskStatus),
            dueDate: faker.date.soon({ days: 30 }),
            assignedTo: faker.helpers.arrayElements(teamUserIds, { min: 1, max: 2 }), // Assign cho user có thật
            createdBy: ownerId,
            team: team._id,
            organization: org._id,
            progress: faker.number.int({ min: 0, max: 100 }),
            createdAt: faker.date.recent({ days: 60 }),
          });
        }
      }
      
      await this.taskModel.insertMany(taskDocs);
      console.log(`✅ Đã seed xong Org ${i + 1}/${ORG_COUNT} (Bao gồm Users, Org, Teams, Tasks)`);
    }

    console.log('🎉 Hoàn tất Seeding Data! Dữ liệu đã match hoàn toàn với nhau.');
  }
}