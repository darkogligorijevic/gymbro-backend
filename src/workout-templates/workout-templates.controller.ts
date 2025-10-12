import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { WorkoutTemplatesService } from './workout-templates.service';
import { CreateWorkoutTemplateDto } from './dto/create-workout-template.dto';
import { UpdateWorkoutTemplateDto } from './dto/update-workout-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Workout Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workout-templates')
export class WorkoutTemplatesController {
  constructor(private readonly workoutTemplatesService: WorkoutTemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Kreiraj novi šablon treninga' })
  @ApiResponse({ status: 201, description: 'Šablon uspešno kreiran' })
  create(@Request() req, @Body() createDto: CreateWorkoutTemplateDto) {
    return this.workoutTemplatesService.create(req.user.userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Preuzmi sve svoje šablone treninga' })
  @ApiResponse({ status: 200, description: 'Lista šablona' })
  findAll(@Request() req) {
    return this.workoutTemplatesService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Preuzmi šablon treninga po ID-u' })
  @ApiResponse({ status: 200, description: 'Šablon pronađen' })
  @ApiResponse({ status: 404, description: 'Šablon nije pronađen' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.workoutTemplatesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriraj šablon treninga' })
  @ApiResponse({ status: 200, description: 'Šablon uspešno ažuriran' })
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: UpdateWorkoutTemplateDto,
  ) {
    return this.workoutTemplatesService.update(id, req.user.userId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Obriši šablon treninga' })
  @ApiResponse({ status: 200, description: 'Šablon uspešno obrisan' })
  remove(@Param('id') id: string, @Request() req) {
    return this.workoutTemplatesService.remove(id, req.user.userId);
  }
}