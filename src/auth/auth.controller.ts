import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ short: { limit: 3, ttl: 1000 } }) // 3 pokušaja u sekundi
  @Throttle({ long: { limit: 5, ttl: 60000 } }) // 5 pokušaja u minuti
  @ApiOperation({ summary: 'Prijava korisnika' })
  @ApiResponse({ status: 200, description: 'Uspešna prijava' })
  @ApiResponse({ status: 401, description: 'Neispravni kredencijali' })
  @ApiResponse({ status: 429, description: 'Previše pokušaja prijave' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // @Post('register')
  // @ApiOperation({ summary: 'Registracija novog korisnika' })
  // @ApiResponse({ status: 201, description: 'Korisnik uspešno registrovan' })
  // @ApiResponse({ status: 400, description: 'Neispravni podaci' })
  // async register(@Body() registerDto: RegisterDto) {
  //   return this.authService.register(registerDto);
  // }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Preuzmi profil trenutno ulogovanog korisnika' })
  @ApiResponse({ status: 200, description: 'Profil korisnika' })
  getProfile(@Request() req) {
    return req.user;
  }
}