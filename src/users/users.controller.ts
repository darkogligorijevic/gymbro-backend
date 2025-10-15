import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Post,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @ApiOperation({ summary: 'Pretraži korisnike po username-u' })
  @ApiResponse({ status: 200, description: 'Lista pronađenih korisnika' })
  searchUsers(@Query('q') query: string) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query je obavezan');
    }
    return this.usersService.searchUsers(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Preuzmi moje podatke' })
  @ApiResponse({ status: 200, description: 'Podaci trenutnog korisnika' })
  getMe(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Preuzmi korisnika po ID-u' })
  @ApiResponse({ status: 200, description: 'Korisnik pronađen' })
  @ApiResponse({ status: 404, description: 'Korisnik nije pronađen' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Preuzmi javni profil korisnika sa statistikom' })
  @ApiResponse({ status: 200, description: 'Profil korisnika sa statistikom' })
  getProfile(@Param('id') id: string) {
    return this.usersService.getUserProfile(id);
  }

  @Post(':id/avatar')
  @ApiOperation({ summary: 'Upload avatara korisnika' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException('Samo slike su dozvoljene!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('Fajl nije pronađen');
    }
    
    // Proveri da li korisnik pokušava da uploaduje svoj avatar
    if (id !== req.user.id) {
      throw new BadRequestException('Možeš uploadovati samo svoj avatar');
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateAvatar(id, avatarUrl);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriraj korisnika' })
  @ApiResponse({ status: 200, description: 'Korisnik uspešno ažuriran' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    // Proveri da li korisnik pokušava da ažurira sebe
    if (id !== req.user.id) {
      throw new BadRequestException('Možeš ažurirati samo svoj profil');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Promeni lozinku' })
  @ApiResponse({ status: 200, description: 'Lozinka uspešno promenjena' })
  changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req,
  ) {
    if (id !== req.user.id) {
      throw new BadRequestException('Možeš promeniti samo svoju lozinku');
    }
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Obriši nalog' })
  @ApiResponse({ status: 200, description: 'Nalog uspešno obrisan' })
  remove(@Param('id') id: string, @Request() req) {
    if (id !== req.user.id) {
      throw new BadRequestException('Možeš obrisati samo svoj nalog');
    }
    return this.usersService.remove(id);
  }
}