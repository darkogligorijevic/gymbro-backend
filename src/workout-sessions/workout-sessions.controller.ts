import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { WorkoutSessionsService } from './workout-sessions.service';
import { StartWorkoutDto } from './dto/start-workout.dto';
import { CompleteSetDto } from './dto/complete-set.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Workout Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workout-sessions')
export class WorkoutSessionsController {
  constructor(private readonly workoutSessionsService: WorkoutSessionsService) {}

  @Post('start')
  @ApiOperation({ 
    summary: 'Clock In - Započni trening', 
    description: 'Pokreće novi trening na osnovu šablona. Automatski postavlja prvu vežbu kao aktivnu.' 
  })
  @ApiResponse({ status: 201, description: 'Trening uspešno započet' })
  @ApiResponse({ status: 400, description: 'Već imate aktivan trening' })
  startWorkout(@Request() req, @Body() startDto: StartWorkoutDto) {
    return this.workoutSessionsService.startWorkout(req.user.userId, startDto);
  }

  @Patch(':id/complete-set')
  @ApiOperation({ 
    summary: 'Završi set', 
    description: 'Unosi broj ponavljanja za set. Automatski prelazi na sledeći set/vežbu kada se završi.' 
  })
  @ApiResponse({ status: 200, description: 'Set uspešno završen' })
  completeSet(
    @Param('id') id: string,
    @Request() req,
    @Body() completeSetDto: CompleteSetDto,
  ) {
    return this.workoutSessionsService.completeSet(id, req.user.userId, completeSetDto);
  }

  @Post(':id/finish')
  @ApiOperation({ 
    summary: 'Clock Out - Završi trening', 
    description: 'Završava trenutni trening i izračunava trajanje.' 
  })
  @ApiResponse({ status: 200, description: 'Trening uspešno završen' })
  finishWorkout(@Param('id') id: string, @Request() req) {
    return this.workoutSessionsService.finishWorkout(id, req.user.userId);
  }

  @Get('active')
  @ApiOperation({ 
    summary: 'Preuzmi aktivan trening', 
    description: 'Vraća trenutno aktivni trening ako postoji.' 
  })
  @ApiResponse({ status: 200, description: 'Aktivan trening' })
  getActiveWorkout(@Request() req) {
    return this.workoutSessionsService.getActiveWorkout(req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Preuzmi sve treninge' })
  @ApiResponse({ status: 200, description: 'Lista treninga' })
  findAll(@Request() req) {
    return this.workoutSessionsService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Preuzmi trening po ID-u' })
  @ApiResponse({ status: 200, description: 'Trening pronađen' })
  @ApiResponse({ status: 404, description: 'Trening nije pronađen' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.workoutSessionsService.findOne(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Obriši trening' })
  @ApiResponse({ status: 200, description: 'Trening uspešno obrisan' })
  remove(@Param('id') id: string, @Request() req) {
    return this.workoutSessionsService.remove(id, req.user.userId);
  }
}