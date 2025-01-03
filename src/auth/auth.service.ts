import { BadRequestException, ForbiddenException, GoneException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ERRORS_MSG, isValidHash } from '../shared';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/sign-in.dto';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/jwt.entity';
import { Repository } from 'typeorm';
import { OtpCode } from './entities/otp.entity';
import * as ms from "ms";
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

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
    private readonly httpService: HttpService
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

    // const sendSms = await this.sendSMSToUser(otp, phoneNumber);

    // return {sendSms};

    return {message: 'ok'}
  }

  async sendOtp(otp: string, phoneNumber: string) {
    const user = await this.usersService.findOne({where: {phoneNumber}});

    const otpCodeForFoundedUser = await this.otpCodeRepository.findOne({where: {user: {id: user.id}}});

    const isOtpNotExpired = new Date() < otpCodeForFoundedUser.expiresAt;
    
    if (!isOtpNotExpired) {
      throw new GoneException(ERRORS_MSG.EXPIRED_ERROR)
    }

    if (otpCodeForFoundedUser.otp !== otp) {
      throw new UnauthorizedException(ERRORS_MSG.WRONG_CODE);
    }

    await this.otpCodeRepository.remove(otpCodeForFoundedUser) 

    user.isVerified = true;
    const {createdAt, password, email, refreshTokens, ...userInfo} = await this.usersService.save(user);

    return userInfo;
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

  private sendSMSToUser = async (otp: string, desctinationPhoneNumber: string) => {
    const {EXOLVE_API_KEY: api_key, EXOLVE_API_BASE_URL: baseUrl, EXOLVE_API_SENDER_PHONE_NUMBER: senderPhoneNumber} = process.env;

    const url = `${baseUrl}/SendSMS`;

    const text = `Ваш код подтверждения в Rocket Chat: ${otp}`; 

    const body = {
      number: senderPhoneNumber,
      desstination: desctinationPhoneNumber,
      text,
    };
    
    const headers = {
      Authorization: `Bearer ${api_key}`,
      'Content-Type': 'application/json',
    };

    try {
      const sendSms = this.httpService.post(url, body, {headers});
      const response = await lastValueFrom(sendSms);
      return response.data;
    } catch {
      throw new BadRequestException(ERRORS_MSG.SEND_SMS_ERROR)
    }
  }
}
