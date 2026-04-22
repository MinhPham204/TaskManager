import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model, Types, Connection } from 'mongoose';
import type { StringValue } from 'ms';
import { RedisService } from '../../common/services/redis.service';
import { EmailService } from '../../common/services/email.service';
import { User, UserDocument } from '../user/schemas/user.schema';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { Organization, OrganizationDocument } from '../organization/schemas/organization.schema';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  profileImageUrl: string | null;
  organization: Types.ObjectId | any;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Organization.name) private readonly organizationModel: Model<OrganizationDocument>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
    @InjectConnection() private readonly connection: Connection,
  ) { }

  // REGISTER FLOW (3 bước)
  /**
   * Bước 1: Gửi OTP đến email.
   * Không tạo user cho đến khi set password thành công.
   */
  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const otp = this.generateOtp();
    await this.redisService.setOtp(dto.email, otp, 300); // TTL 5 phút

    await this.emailService.sendOtpEmail(dto.email, otp);
    this.logger.log(`OTP sent to ${dto.email}`);

    return { message: 'OTP sent to your email. Valid for 5 minutes.' };
  }

  /**
   * Bước 2: Xác minh OTP → trả về verifiedToken (JWT ngắn hạn 10 phút).
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<{ verifiedToken: string }> {
    const storedOtp = await this.redisService.getOtp(dto.email);

    if (!storedOtp) {
      throw new BadRequestException('OTP has expired or was not found');
    }
    if (storedOtp !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Xóa OTP sau khi dùng để tránh replay attack
    await this.redisService.deleteOtp(dto.email);

    const verifiedToken = this.jwtService.sign(
      { email: dto.email },
      {
        secret: this.config.get<string>('JWT_VERIFIED_SECRET') as string,
        expiresIn: this.config.get<string>('JWT_VERIFIED_EXPIRES_IN') as StringValue,
      },
    );

    return { verifiedToken };
  }

  /**
   * Bước 3: Nhập mật khẩu + họ tên → tạo tài khoản + issue tokens.
   * verifiedToken được gửi qua Authorization header.
   *
   * Flow:
   *  1. Verify verifiedToken
   *  2. Kiểm tra email chưa đăng ký
   *  3. Pre-generate userId (giải quyết chicken-and-egg: org cần owner, user cần org)
   *  4. Tạo Organization với owner = userId (pre-gen)
   *  5. Tạo User với organization = org._id, _id = userId (pre-gen)
   *  6. Issue & return tokens
   */
  async setPassword(
    verifiedToken: string,
    dto: SetPasswordDto,
  ): Promise<TokenPair & { user: UserResponse }> {
    // 1. Verify verifiedToken
    let payload: { email: string };
    try {
      payload = this.jwtService.verify(verifiedToken, {
        secret: this.config.get<string>('JWT_VERIFIED_SECRET'),
      });
    } catch {
      throw new BadRequestException('Verified token is invalid or expired');
    }

    const { email } = payload;

    // 2. Double-check email chưa đăng ký (edge case: 2 tab cùng submit)
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    // 3. Pre-generate userId → phá vòng lặp phụ thuộc:
    //    - Organization.owner cần userId
    //    - User.organization cần orgId
    //    Giải pháp: tạo ObjectId trước, dùng cho cả hai
    const userId = new Types.ObjectId();

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Transaction 
    const session = await this.connection.startSession();
    session.startTransaction();

    let user;
    let org;

    try {
      // 5. Tạo Organization (Truyền session vào)
      // Lưu ý: Mongoose create với session thường trả về mảng, nên lấy phần tử [0]
      const createdOrgs = await this.organizationModel.create(
        [
          {
            name: dto.organizationName, 
            owner: userId,
            members: [userId],
          },
        ],
        { session },
      );
      org = createdOrgs[0];

      // 6. Tạo User (Truyền session vào)
      const createdUsers = await this.userModel.create(
        [
          {
            _id: userId,
            name: dto.fullName,
            email,
            password: hashedPassword,
            organization: org._id,
            role: 'owner',
          },
        ],
        { session },
      );
      user = createdUsers[0];

      // Nếu cả 2 đều thành công -> Xác nhận lưu vào DB
      await session.commitTransaction();
    } catch (error) {
      // Nếu có bất kỳ lỗi gì xảy ra -> Rollback (Hủy bỏ) cả Org lẫn User
      await session.abortTransaction();
      throw error; // Ném lỗi ra ngoài để kẹp vào Global Filter
    } finally {
      // Đóng phiên giao dịch
      session.endSession();
    }

    // 7. Issue tokens & cập nhật refreshToken
    const tokens = await this.issueTokens(user);
    await this.userService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
    );

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }


  // ═══════════════════════════════════════════════════════════════════
  // LOGIN / LOGOUT / REFRESH
  // ═══════════════════════════════════════════════════════════════════

  async login(dto: LoginDto): Promise<TokenPair & { user: UserResponse }> {
    const user = await this.userService.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user);
    await this.userService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
    );

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.userService.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  /**
   * Refresh tokens: nhận user từ JwtRefreshStrategy (có raw refreshToken).
   * Verify hash từ DB → issue cặp tokens mới.
   */
  async refreshTokens(
    userId: string,
    rawRefreshToken: string,
  ): Promise<TokenPair> {
    const user = await this.userModel
      .findById(userId)
      .select('+refreshToken');

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access denied — please log in again');
    }

    const tokenMatches = await bcrypt.compare(
      rawRefreshToken,
      user.refreshToken,
    );
    if (!tokenMatches) {
      throw new ForbiddenException('Refresh token mismatch — please log in again');
    }

    const tokens = await this.issueTokens(user);
    await this.userService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
    );

    return tokens;
  }

  // ═══════════════════════════════════════════════════════════════════
  // PROFILE
  // ═══════════════════════════════════════════════════════════════════

  async getProfile(userId: string): Promise<UserDocument> {
    return this.userService.findById(userId);
  }

  async updateProfile(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UserDocument> {
    return this.userService.update(userId, dto);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect current password');
    }

    await this.userService.changePassword(userId, dto.newPassword);
    return { message: 'Password changed successfully' };
  }

  // ═══════════════════════════════════════════════════════════════════
  // FORGOT / RESET PASSWORD
  // ═══════════════════════════════════════════════════════════════════

  async forgotPassword(email: string): Promise<{ message: string }> {
    const GENERIC_MSG =
      'If an account with that email exists, a reset code has been sent.';

    const user = await this.userModel.findOne({ email });
    if (!user) {
      // Không tiết lộ email có tồn tại hay không
      return { message: GENERIC_MSG };
    }

    const otp = this.generateOtp();
    await this.redisService.setResetOtp(email, otp, 300);
    await this.emailService.sendPasswordResetEmail(email, otp);

    return { message: GENERIC_MSG };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const storedOtp = await this.redisService.getResetOtp(dto.email);

    if (!storedOtp || storedOtp !== dto.otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.redisService.deleteResetOtp(dto.email);
    await this.userModel.updateOne(
      { email: dto.email },
      { password: await bcrypt.hash(dto.newPassword, 10) },
    );

    return { message: 'Password has been reset. You can now log in.' };
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════

  private async issueTokens(user: UserDocument): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET') as string,
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') as StringValue,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') as string,
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') as StringValue,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private sanitizeUser(user: UserDocument): UserResponse {
    return {
      _id: user._id as Types.ObjectId,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      organization: user.organization,
    };
  }
}
