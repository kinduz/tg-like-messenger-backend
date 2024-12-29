import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { isValidHash, SUCCESS_MSG } from '../shared';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/sign-in.dto';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/jwt.entity';
import { Repository } from 'typeorm';
import { OtpCode } from './entities/otp.entity';
import * as ms from "ms";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(OtpCode)
    private otpCodeRepository: Repository<OtpCode>,
  ) {}

  async startLoginByPhoneNumber(phoneNumber: string) {
    const user = await this.usersService.findOne({where: {phoneNumber}});

    const otpCodeForFoundedUser = await this.otpCodeRepository.findOne({where: {user: {id: user.id}}});
    
    if (otpCodeForFoundedUser) {
      await this.otpCodeRepository.remove(otpCodeForFoundedUser)
    }

    const {otp, expiresAt} = this.generateOtpCode();

    const otpCode = this.otpCodeRepository.create({
      user,
      otp,
      expiresAt
    });

    const savedOtpCode = await this.otpCodeRepository.save(otpCode);
    
    user.otp = savedOtpCode;
    await this.usersService.save(user); 

    return {message: SUCCESS_MSG.DEFAULT_SUCCESS_MSG_FOR_HTTP};
  }

  async auth(user: SignInDto) {
    const payload = { id: user.id, username: user.username };

    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get("JWT_ACCESS_SECRET"),
      expiresIn: this.configService.get("JWT_ACCESS_EXPIRATION"),
    })

    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get("JWT_REFRESH_SECRET"),
      expiresIn: this.configService.get("JWT_REFRESH_EXPIRATION"),
    })

    const newRefreshToken = this.refreshTokenRepository.create({
      token: refresh_token,
      user: await this.usersService.findOne({where: {id: user.id}}),
      expiresAt: this.getRefreshTokenExpiration(),
    });

    await this.refreshTokenRepository.save(newRefreshToken);
    
    return { access_token, refresh_token };
  }

  async validatePassword(username: string, password: string) {
    const user = await this.usersService.findOne({
      select: { id: true, password: true, username: true },
      where: { username },
    });

    const isPasswordMatchesHash = await isValidHash(password, user.password);

    if (!user || !isPasswordMatchesHash) {
      throw new UnauthorizedException();
    }

    const { password: userPassword, ...result } = user;
    return result;
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const existingToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, user: {id: userId} },
    });

    if (!existingToken) {
      throw new ForbiddenException('Invalid refresh token');
    }

    if (existingToken.expiresAt && new Date() > existingToken.expiresAt) {
      await this.refreshTokenRepository.remove(existingToken);
      throw new ForbiddenException('Refresh token expired');
    }

    const user = await this.usersService.findOne({where: {id: userId}});
    const payload = { id: user.id, username: user.username };

    const newAccessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION'),
    });

    const newRefreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
    });

    await this.refreshTokenRepository.remove(existingToken);

    const newRefreshTokenEntity = this.refreshTokenRepository.create({
      token: newRefreshToken,
      user,
      expiresAt: this.getRefreshTokenExpiration(),
    });
    await this.refreshTokenRepository.save(newRefreshTokenEntity);

    return { access_token: newAccessToken, refresh_token: newRefreshToken };
  }

  async revokeRefreshToken(userId: string, refreshToken: string) {
    const existingToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, user: { id: userId } },
    }); 

    if (existingToken) {
      await this.refreshTokenRepository.remove(existingToken);
    }

    return;
  }

  private getRefreshTokenExpiration(): Date {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRATION');
    const now = new Date();
    if (expiresIn.endsWith('d')) {
      now.setDate(now.getDate() + parseInt(expiresIn.replace('d', ''), 10));
    } else if (expiresIn.endsWith('h')) {
      now.setHours(now.getHours() + parseInt(expiresIn.replace('h', ''), 10));
    }
    return now;
  }

  private generateOtpCode = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresDuration = process.env.OTP_LIFETIME || "3m";
    const expiresAt = new Date(Date.now() + ms(expiresDuration));

    return {otp, expiresAt}
  }
}
