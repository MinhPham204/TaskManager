import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // Create user
  async create(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = new this.userModel({
      ...dto,
      password: hashedPassword,
      organization: new Types.ObjectId(dto.organization),
    });

    return user.save();
  }

  // Find user by ID 
  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(id)
      .select('-password')
      .populate('organization', 'name slug plan');

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return user;
  }

  // find by Email
  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email })
      .select('+password +refreshToken'); // select field ẩn
  }

  // find by Email (không trả về password)
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email })
      .select('-password')
      .populate('organization', 'name slug plan');
  }

  // Update user
  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .select('-password')
      .populate('organization', 'name slug plan');

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return user;
  }

  // Update refresh token (lưu hashed token)
  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    if (refreshToken === null) {
      await this.userModel.findByIdAndUpdate(userId, {
        $set: { refreshToken: null },
      });
      return;
    }

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { refreshToken: hashedRefreshToken },
    });
  }

  // Change password
  async changePassword(
    userId: string,
    newPassword: string,
  ): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { password: hashedPassword },
    });
  }

  // Find all users in an organization
  async findByOrganization(organizationId: string): Promise<UserDocument[]> {
    return this.userModel
      .find({ organization: new Types.ObjectId(organizationId) })
      .select('-password')
      .populate('team', 'name');
  }
}
