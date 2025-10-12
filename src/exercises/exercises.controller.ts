import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MuscleGroup } from './entities/exercise.entity';

@ApiTags('Exercises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post()
  @ApiOperation({ summary: 'Kreiraj novu vežbu' })
  @ApiResponse({ status: 201, description: 'Vežba uspešno kreirana' })
  create(@Body() createExerciseDto: CreateExerciseDto) {
    return this.exercisesService.create(createExerciseDto);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Popuni bazu inicijalnim vežbama' })
  @ApiResponse({ status: 201, description: 'Vežbe uspešno dodate' })
  seed() {
    return this.exercisesService.seed();
  }

  @Get()
  @ApiOperation({ summary: 'Preuzmi sve vežbe' })
  @ApiQuery({ name: 'muscleGroup', enum: MuscleGroup, required: false })
  @ApiResponse({ status: 200, description: 'Lista vežbi' })
  findAll(@Query('muscleGroup') muscleGroup?: MuscleGroup) {
    if (muscleGroup) {
      return this.exercisesService.findByMuscleGroup(muscleGroup);
    }
    return this.exercisesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Preuzmi vežbu po ID-u' })
  @ApiResponse({ status: 200, description: 'Vežba pronađena' })
  @ApiResponse({ status: 404, description: 'Vežba nije pronađena' })
  findOne(@Param('id') id: string) {
    return this.exercisesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriraj vežbu' })
  @ApiResponse({ status: 200, description: 'Vežba uspešno ažurirana' })
  update(@Param('id') id: string, @Body() updateExerciseDto: UpdateExerciseDto) {
    return this.exercisesService.update(id, updateExerciseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Obriši vežbu (soft delete)' })
  @ApiResponse({ status: 200, description: 'Vežba uspešno obrisana' })
  remove(@Param('id') id: string) {
    return this.exercisesService.remove(id);
  }
}