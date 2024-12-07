import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/sign-up.dto';
import { User } from '../users/entities/user.entity';
import { LocalGuard } from './passport-strategies/local/local-guard';
import { Request } from 'express';

@Controller('')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @UseGuards(LocalGuard)
  @Post('signin')
  async signIn(@Req() req: Request) {
    return this.authService.auth(req.user as User);
  }

  @Post('signup')
  async signUp(@Body() createUserDto: SignUpDto) {
    const user = await this.userService.create(createUserDto);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
