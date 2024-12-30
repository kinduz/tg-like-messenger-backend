import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('send-otp')
  async startLogin(@Body('phoneNumber') phoneNumber: string) {
    return this.authService.startLoginByPhoneNumber(phoneNumber)
  }

  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    const { userId, refreshToken } = refreshTokenDto;
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('revoke')
  async revokeToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const { userId, refreshToken } = refreshTokenDto;
    await this.authService.revokeRefreshToken(userId, refreshToken);
    return { message: 'Refresh token revoked' };
  }
}
