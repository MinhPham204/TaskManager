import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiHeader } from '@nestjs/swagger'; 
import { AuthService } from './auth.service';
import { GetUser } from './decorators/get-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

interface AuthUser {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
  profileImageUrl: string | null;
  organization: unknown;
}

interface RefreshUser extends AuthUser {
  rawRefreshToken: string;
}

@ApiTags('Auth') // 👉 GOM NHÓM LÊN SWAGGER UI
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // ═══════════════════════════════════════════════════
  // REGISTER FLOW (3 bước)
  // ═══════════════════════════════════════════════════

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bước 1: Đăng ký tài khoản và gửi mã OTP tới email' })
  @ApiResponse({ status: 200, description: 'Đã gửi mã OTP tới email' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bước 2: Xác minh mã OTP' })
  @ApiResponse({ status: 200, description: 'Xác minh thành công, trả về verifiedToken' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('set-password')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('verifiedToken')
  @ApiOperation({ summary: 'Bước 3: Đặt mật khẩu để hoàn tất tạo tài khoản' })
  @ApiResponse({ status: 201, description: 'Tạo tài khoản thành công' })
  setPassword(
    @Req() req: any, 
    @Body() dto: SetPasswordDto,
  ) {
    // Tự lôi authorization ra từ object request
    const authHeader = req.headers.authorization; 
    const verifiedToken = authHeader?.replace('Bearer ', '').trim();
    
    return this.authService.setPassword(verifiedToken, dto);
  }
  // ═══════════════════════════════════════════════════
  // LOGIN / LOGOUT / REFRESH
  // ═══════════════════════════════════════════════════

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập vào hệ thống' })
  @ApiResponse({ status: 200, description: 'Trả về accessToken và refreshToken' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('accessToken') // 
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất' })
  logout(@GetUser('_id') userId: { toString(): string }) {
    return this.authService.logout(userId.toString());
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cấp lại Access Token mới bằng Refresh Token' })
  refreshTokens(@GetUser() user: RefreshUser) {
    return this.authService.refreshTokens(
      user._id.toString(),
      user.rawRefreshToken,
    );
  }

  // ═══════════════════════════════════════════════════
  // PROFILE
  // ═══════════════════════════════════════════════════

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('accessToken')
  @ApiOperation({ summary: 'Lấy thông tin profile của user hiện tại' })
  getMe(@GetUser() user: AuthUser) {
    return this.authService.getProfile(user._id.toString());
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('accessToken')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân (tên, avatar)' })
  updateProfile(
    @GetUser('_id') userId: { toString(): string },
    @Body() dto: UpdateUserDto,
  ) {
    return this.authService.updateProfile(userId.toString(), dto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('accessToken')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mật khẩu khi đang đăng nhập' })
  changePassword(
    @GetUser('_id') userId: { toString(): string },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId.toString(), dto);
  }

  // ═══════════════════════════════════════════════════
  // FORGOT / RESET PASSWORD
  // ═══════════════════════════════════════════════════

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quên mật khẩu: Gửi link/OTP reset pass về email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu mới bằng token reset' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}