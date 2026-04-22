import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { MongooseModule } from '@nestjs/mongoose';
import { SeederCommand } from './seeder.command';

// Import Schemas
import { Organization, OrganizationSchema } from '../organization/schemas/organization.schema';
import { Team, TeamSchema } from '../team/schemas/team.schema';
import { Task, TaskSchema } from '../task/schemas/task.schema';
import { User, UserSchema } from '../user/schemas/user.schema';

@Module({
  imports: [
    CommandModule,
    // Load model để thao tác database
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Team.name, schema: TeamSchema },
      { name: Task.name, schema: TaskSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [SeederCommand],
})
export class SeederModule {}