import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../../users/users.service';
import { Injectable } from '@nestjs/common';

interface JWTPayload {
  id: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService?.get<string>('JWT_SECRET') || 'secret',
    });
  }

  async validate(jwtPayload: JWTPayload) {
    return { id: jwtPayload.id, username: jwtPayload.username };
  }
}
