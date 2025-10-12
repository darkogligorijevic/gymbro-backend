import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise, MuscleGroup } from './entities/exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise)
    private exercisesRepository: Repository<Exercise>,
  ) {}

  async create(createExerciseDto: CreateExerciseDto): Promise<Exercise> {
    const exercise = this.exercisesRepository.create(createExerciseDto);
    return await this.exercisesRepository.save(exercise);
  }

  async findAll(): Promise<Exercise[]> {
    return await this.exercisesRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findByMuscleGroup(muscleGroup: MuscleGroup): Promise<Exercise[]> {
    return await this.exercisesRepository.find({
      where: { muscleGroup, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Exercise> {
    const exercise = await this.exercisesRepository.findOne({ where: { id } });
    if (!exercise) {
      throw new NotFoundException('Vežba nije pronađena');
    }
    return exercise;
  }

  async update(id: string, updateExerciseDto: UpdateExerciseDto): Promise<Exercise> {
    const exercise = await this.findOne(id);
    Object.assign(exercise, updateExerciseDto);
    return await this.exercisesRepository.save(exercise);
  }

  async remove(id: string): Promise<void> {
    const exercise = await this.findOne(id);
    exercise.isActive = false;
    await this.exercisesRepository.save(exercise);
  }

  async seed(): Promise<void> {
    const count = await this.exercisesRepository.count();
    if (count > 0) return;

    const exercises = [
      { name: 'Bench Press', muscleGroup: MuscleGroup.CHEST, description: 'Klasični potisak na ravnoj klupi' },
      { name: 'Incline Bench Press', muscleGroup: MuscleGroup.CHEST, description: 'Potisak na kosoj klupi' },
      { name: 'Deadlift', muscleGroup: MuscleGroup.BACK, description: 'Mrtvo dizanje' },
      { name: 'Pull-ups', muscleGroup: MuscleGroup.BACK, description: 'Zgibovi' },
      { name: 'Barbell Row', muscleGroup: MuscleGroup.BACK, description: 'Veslanje sa šipkom' },
      { name: 'Squat', muscleGroup: MuscleGroup.LEGS, description: 'Čučanj' },
      { name: 'Leg Press', muscleGroup: MuscleGroup.LEGS, description: 'Potisak nogama' },
      { name: 'Overhead Press', muscleGroup: MuscleGroup.SHOULDERS, description: 'Potisak iznad glave' },
      { name: 'Lateral Raises', muscleGroup: MuscleGroup.SHOULDERS, description: 'Bočna dizanja' },
      { name: 'Bicep Curls', muscleGroup: MuscleGroup.BICEPS, description: 'Pregibanje ruku sa tegom' },
      { name: 'Tricep Dips', muscleGroup: MuscleGroup.TRICEPS, description: 'Sklekovi na paralelnom drvu' },
      { name: 'Plank', muscleGroup: MuscleGroup.CORE, description: 'Plank vežba za core' },
    ];

    for (const exercise of exercises) {
      await this.exercisesRepository.save(this.exercisesRepository.create(exercise));
    }
  }
}