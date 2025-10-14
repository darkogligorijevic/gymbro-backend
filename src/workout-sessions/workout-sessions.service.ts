import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutSession } from './entities/workout-session.entity';
import { SessionExercise, ExerciseStatus } from './entities/session-exercise.entity';
import { SessionSet } from './entities/session-set.entity';
import { WorkoutTemplatesService } from '../workout-templates/workout-templates.service';
import { StartWorkoutDto } from './dto/start-workout.dto';
import { CompleteSetDto } from './dto/complete-set.dto';
import { AddSetDto } from './dto/add-set.dto';

@Injectable()
export class WorkoutSessionsService {
  constructor(
    @InjectRepository(WorkoutSession)
    private sessionsRepository: Repository<WorkoutSession>,
    @InjectRepository(SessionExercise)
    private sessionExercisesRepository: Repository<SessionExercise>,
    @InjectRepository(SessionSet)
    private sessionSetsRepository: Repository<SessionSet>,
    private workoutTemplatesService: WorkoutTemplatesService,
  ) {}

  async startWorkout(userId: string, startDto: StartWorkoutDto): Promise<WorkoutSession> {
    const activeSession = await this.sessionsRepository.findOne({
      where: { userId, isWorkoutFinished: false },
    });

    if (activeSession) {
      throw new BadRequestException('Već imate aktivan trening. Završite ga pre nego što započnete novi.');
    }

    const template = await this.workoutTemplatesService.findOne(
      startDto.workoutTemplateId,
      userId,
    );

    const session = this.sessionsRepository.create({
      userId,
      workoutTemplateId: template.id,
      clockIn: new Date(),
      isWorkoutFinished: false,
    });

    session.exercises = template.exercises.map((templateExercise) => {
      const exercise = this.sessionExercisesRepository.create({
        exerciseId: templateExercise.exerciseId,
        orderIndex: templateExercise.orderIndex,
        notes: templateExercise.notes,
        status: ExerciseStatus.NOT_STARTED,
      });

      exercise.sets = templateExercise.sets.map((templateSet) =>
        this.sessionSetsRepository.create({
          setNumber: templateSet.setNumber,
          targetWeight: templateSet.targetWeight,
          targetReps: templateSet.targetReps,
          isCompleted: false
        }),
      );

      return exercise;
    });

    if (session.exercises.length > 0) {
      session.exercises[0].status = ExerciseStatus.IN_PROGRESS;
    }

    return await this.sessionsRepository.save(session);
  }

  async completeSet(
    sessionId: string,
    userId: string,
    completeSetDto: CompleteSetDto,
  ): Promise<WorkoutSession> {
    const session = await this.findOne(sessionId, userId);

    if (session.isWorkoutFinished) {
      throw new BadRequestException('Ovaj trening je već završen');
    }

    const set = await this.sessionSetsRepository.findOne({
      where: { id: completeSetDto.setId },
      relations: ['sessionExercise'],
    });

    if (!set) {
      throw new NotFoundException('Set nije pronađen');
    }

    if (set.sessionExercise.workoutSessionId !== sessionId) {
      throw new BadRequestException('Set ne pripada ovom treningu');
    }

    // Update set with actual values
    set.actualReps = completeSetDto.actualReps;
    set.actualWeight = completeSetDto.actualWeight || set.targetWeight;
    set.isCompleted = true;
    await this.sessionSetsRepository.save(set);

    // Refresh session to get updated data
    const updatedSession = await this.findOne(sessionId, userId);

    // Find the exercise that contains this set
    const exercise = updatedSession.exercises.find(
      ex => ex.sets.some(s => s.id === set.id)
    );

    if (exercise && exercise.status === ExerciseStatus.IN_PROGRESS) {
      // Check if ALL sets in this exercise are completed
      const allSetsCompleted = exercise.sets.every(s => s.isCompleted);

      if (allSetsCompleted) {
        // Mark current exercise as finished
        exercise.status = ExerciseStatus.FINISHED;
        await this.sessionExercisesRepository.save(exercise);

        // Find next NOT_STARTED exercise
        const nextExercise = updatedSession.exercises.find(
          ex => ex.status === ExerciseStatus.NOT_STARTED
        );

        if (nextExercise) {
          // Start next exercise
          nextExercise.status = ExerciseStatus.IN_PROGRESS;
          await this.sessionExercisesRepository.save(nextExercise);
        } else {
          // No more exercises - finish workout automatically
          return await this.finishWorkout(sessionId, userId);
        }
      }
    }

    return await this.findOne(sessionId, userId);
  }

  // NEW: Add extra set to exercise
  async addSet(
    sessionId: string,
    exerciseId: string,
    userId: string,
    weight: number,
    reps: number,
  ): Promise<WorkoutSession> {
    const session = await this.findOne(sessionId, userId);

    if (session.isWorkoutFinished) {
      throw new BadRequestException('Ovaj trening je već završen');
    }

    const exercise = await this.sessionExercisesRepository.findOne({
      where: { id: exerciseId },
      relations: ['sets'],
    });

    if (!exercise) {
      throw new NotFoundException('Vežba nije pronađena');
    }

    if (exercise.workoutSessionId !== sessionId) {
      throw new BadRequestException('Vežba ne pripada ovom treningu');
    }

    const newSetNumber = exercise.sets.length + 1;
    const newSet = this.sessionSetsRepository.create({
      sessionExerciseId: exerciseId,
      setNumber: newSetNumber,
      targetWeight: weight,
      targetReps: reps,
      isCompleted: false,
    });

    await this.sessionSetsRepository.save(newSet);
    return await this.findOne(sessionId, userId);
  }

  // NEW: Skip to next exercise
  async skipExercise(
    sessionId: string,
    exerciseId: string,
    userId: string,
  ): Promise<WorkoutSession> {
    const session = await this.findOne(sessionId, userId);

    if (session.isWorkoutFinished) {
      throw new BadRequestException('Ovaj trening je već završen');
    }

    const exercise = await this.sessionExercisesRepository.findOne({
      where: { id: exerciseId },
    });

    if (!exercise || exercise.workoutSessionId !== sessionId) {
      throw new BadRequestException('Vežba nije pronađena ili ne pripada ovom treningu');
    }

    if (exercise.status !== ExerciseStatus.IN_PROGRESS) {
      throw new BadRequestException('Vežba nije aktivna');
    }

    // Set current exercise as NOT_STARTED (skipped)
    exercise.status = ExerciseStatus.NOT_STARTED;
    await this.sessionExercisesRepository.save(exercise);

    // Find next NOT_STARTED exercise
    const updatedSession = await this.findOne(sessionId, userId);
    const nextExercise = updatedSession.exercises.find(
      (ex) => ex.status === ExerciseStatus.NOT_STARTED && ex.id !== exerciseId,
    );

    if (nextExercise) {
      nextExercise.status = ExerciseStatus.IN_PROGRESS;
      await this.sessionExercisesRepository.save(nextExercise);
    }

    return await this.findOne(sessionId, userId);
  }

  // NEW: Resume skipped exercise
  async resumeExercise(
    sessionId: string,
    exerciseId: string,
    userId: string,
  ): Promise<WorkoutSession> {
    const session = await this.findOne(sessionId, userId);

    if (session.isWorkoutFinished) {
      throw new BadRequestException('Ovaj trening je već završen');
    }

    const exercise = await this.sessionExercisesRepository.findOne({
      where: { id: exerciseId },
    });

    if (!exercise || exercise.workoutSessionId !== sessionId) {
      throw new BadRequestException('Vežba nije pronađena ili ne pripada ovom treningu');
    }

    if (exercise.status === ExerciseStatus.FINISHED) {
      throw new BadRequestException('Ova vežba je već završena');
    }

    // Set any current IN_PROGRESS exercise back to NOT_STARTED
    const currentExercise = session.exercises.find(
      (ex) => ex.status === ExerciseStatus.IN_PROGRESS,
    );

    if (currentExercise) {
      currentExercise.status = ExerciseStatus.NOT_STARTED;
      await this.sessionExercisesRepository.save(currentExercise);
    }

    // Set selected exercise as IN_PROGRESS
    exercise.status = ExerciseStatus.IN_PROGRESS;
    await this.sessionExercisesRepository.save(exercise);

    return await this.findOne(sessionId, userId);
  }

  async finishWorkout(sessionId: string, userId: string): Promise<WorkoutSession> {
    const session = await this.findOne(sessionId, userId);

    if (session.isWorkoutFinished) {
      throw new BadRequestException('Ovaj trening je već završen');
    }

    const clockOut = new Date();
    const durationMs = clockOut.getTime() - session.clockIn.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    session.clockOut = clockOut;
    session.durationMinutes = durationMinutes;
    session.isWorkoutFinished = true;

    for (const exercise of session.exercises) {
      if (exercise.status !== ExerciseStatus.FINISHED) {
        exercise.status = ExerciseStatus.FINISHED;
        await this.sessionExercisesRepository.save(exercise);
      }
    }

    return await this.sessionsRepository.save(session);
  }

  async findAll(userId: string): Promise<WorkoutSession[]> {
    return await this.sessionsRepository.find({
      where: { userId },
      relations: ['exercises', 'exercises.exercise', 'exercises.sets', 'workoutTemplate'],
      order: {
        clockIn: 'DESC',
        exercises: { orderIndex: 'ASC', sets: { setNumber: 'ASC' } },
      },
    });
  }

  async getActiveWorkout(userId: string): Promise<WorkoutSession | null> {
    return await this.sessionsRepository.findOne({
      where: { userId, isWorkoutFinished: false },
      relations: ['exercises', 'exercises.exercise', 'exercises.sets', 'workoutTemplate'],
      order: {
        exercises: { orderIndex: 'ASC', sets: { setNumber: 'ASC' } },
      },
    });
  }

  async findOne(id: string, userId: string): Promise<WorkoutSession> {
    const session = await this.sessionsRepository.findOne({
      where: { id },
      relations: ['exercises', 'exercises.exercise', 'exercises.sets', 'workoutTemplate'],
      order: {
        exercises: { orderIndex: 'ASC', sets: { setNumber: 'ASC' } },
      },
    });

    if (!session) {
      throw new NotFoundException('Trening nije pronađen');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Nemate pristup ovom treningu');
    }

    return session;
  }

  async remove(id: string, userId: string): Promise<void> {
    const session = await this.findOne(id, userId);
    await this.sessionsRepository.remove(session);
  }
}