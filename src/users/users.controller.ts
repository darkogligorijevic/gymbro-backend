import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Preuzmi sve korisnike' })
  @ApiResponse({ status: 200, description: 'Lista korisnika' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Preuzmi moje podatke' })
  @ApiResponse({ status: 200, description: 'Podaci trenutnog korisnika' })
  getMe(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Preuzmi korisnika po ID-u' })
  @ApiResponse({ status: 200, description: 'Korisnik pronađen' })
  @ApiResponse({ status: 404, description: 'Korisnik nije pronađen' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriraj korisnika' })
  @ApiResponse({ status: 200, description: 'Korisnik uspešno ažuriran' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Obriši korisnika' })
  @ApiResponse({ status: 200, description: 'Korisnik uspešno obrisan' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}