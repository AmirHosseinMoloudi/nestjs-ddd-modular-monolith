import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { IamService } from '../application/iam.service';
import { Public } from '../../../core/infrastructure/security/roles.decorator';
import { AuthGuard } from '../../../core/infrastructure/security/auth.guard';
import { IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { UserRole } from '../domain/iam.types';

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsNotEmpty()
  fullName: string;

  @IsNotEmpty()
  tenantId: string;

  @IsOptional()
  role?: UserRole;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  tenantId: string;
}

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly iamService: IamService) {}

  @Public()
  @Get('tenants')
  async getTenants() {
    return this.iamService.getTenants();
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.iamService.register(dto);
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.iamService.login(dto);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return {
      user: req.user,
    };
  }

  @UseGuards(AuthGuard)
  @Get('users')
  async listUsersInTenant(@Req() req: any) {
    return this.iamService.findUsersByTenant(req.user.tenantId);
  }
}
