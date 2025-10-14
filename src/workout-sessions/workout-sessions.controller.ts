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
import { AddSetDto } from './dto/add-set.dto';
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
    description: 'Unosi broj ponavljanja i opciono kilaže za set.' 
  })
  @ApiResponse({ status: 200, description: 'Set uspešno završen' })
  completeSet(
    @Param('id') id: string,
    @Request() req,
    @Body() completeSetDto: CompleteSetDto,
  ) {
    return this.workoutSessionsService.completeSet(id, req.user.userId, completeSetDto);
  }

  @Post(':id/add-set')
  @ApiOperation({ 
    summary: 'Dodaj dodatni set', 
    description: 'Dodaje dodatni set vežbi tokom treninga' 
  })
  @ApiResponse({ status: 201, description: 'Set uspešno dodat' })
  addSet(
    @Param('id') id: string,
    @Request() req,
    @Body() addSetDto: AddSetDto,
  ) {
    return this.workoutSessionsService.addSet(
      id,
      addSetDto.exerciseId,
      req.user.userId,
      addSetDto.targetWeight,
      addSetDto.targetReps,
    );
  }

  @Post(':id/skip-exercise/:exerciseId')
  @ApiOperation({ 
    summary: 'Preskoči vežbu', 
    description: 'Privremeno preskoči trenutnu vežbu i pređi na sledeću' 
  })
  @ApiResponse({ status: 200, description: 'Vežba preskočena' })
  skipExercise(
    @Param('id') id: string,
    @Param('exerciseId') exerciseId: string,
    @Request() req,
  ) {
    return this.workoutSessionsService.skipExercise(id, exerciseId, req.user.userId);
  }

  @Post(':id/resume-exercise/:exerciseId')
  @ApiOperation({ 
    summary: 'Nastavi preskočenu vežbu', 
    description: 'Vrati se na preskočenu vežbu' 
  })
  @ApiResponse({ status: 200, description: 'Vežba nastavljena' })
  resumeExercise(
    @Param('id') id: string,
    @Param('exerciseId') exerciseId: string,
    @Request() req,
  ) {
    return this.workoutSessionsService.resumeExercise(id, exerciseId, req.user.userId);
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