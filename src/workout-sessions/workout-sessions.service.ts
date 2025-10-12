import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutSession } from './entities/workout-session.entity';
import { SessionExercise, ExerciseStatus } from './entities/session-exercise.entity';
import { SessionSet } from './entities/session-set.entity';
import { WorkoutTemplatesService } from '../workout-templates/workout-templates.service';
import { StartWorkoutDto } from './dto/start-workout.dto';
import { CompleteSetDto } from './dto/complete-set.dto';

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

  // Clock In - Započni trening
 async startWorkout(userId: string, startDto: StartWorkoutDto): Promise<WorkoutSession> {
  // Proveri da li korisnik već ima aktivan trening
  const activeSession = await this.sessionsRepository.findOne({
    where: { userId, isWorkoutFinished: false },
  });

  if (activeSession) {
    throw new BadRequestException('Već imate aktivan trening. Završite ga pre nego što započnete novi.');
  }

  // Preuzmi template
  const template = await this.workoutTemplatesService.findOne(
    startDto.workoutTemplateId,
    userId,
  );

  // Kreiraj workout session
  const session = this.sessionsRepository.create({
    userId,
    workoutTemplateId: template.id,
    clockIn: new Date(),
    isWorkoutFinished: false,
  });

  // Kreiraj vežbe koristeći repository.create() za svaku nested relaciju
  session.exercises = template.exercises.map((templateExercise) => {
    const exercise = this.sessionExercisesRepository.create({
      exerciseId: templateExercise.exerciseId,
      orderIndex: templateExercise.orderIndex,
      notes: templateExercise.notes,
      status: ExerciseStatus.NOT_STARTED,
    });

    // Kreiraj setove koristeći repository.create()
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

  // Postavi prvu vežbu kao "in_progress"
  if (session.exercises.length > 0) {
    session.exercises[0].status = ExerciseStatus.IN_PROGRESS;
  }

  // Sačuvaj sve odjednom zahvaljujući cascade opciji
  return await this.sessionsRepository.save(session);
}

  // Unesi broj ponavljanja za set
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

    // Updejtuj set
    set.actualReps = completeSetDto.actualReps;
    set.isCompleted = true;
    await this.sessionSetsRepository.save(set);

    // Ponovo preuzmi session sa svim relacionim podacima
    const updatedSession = await this.findOne(sessionId, userId);

    // Proveri da li su svi setovi trenutne vežbe završeni
    const currentExercise = updatedSession.exercises.find(
      (ex) => ex.status === ExerciseStatus.IN_PROGRESS,
    );

    if (currentExercise) {
      const allSetsCompleted = currentExercise.sets.every((s) => s.isCompleted);

      if (allSetsCompleted) {
        // Označi trenutnu vežbu kao završenu
        currentExercise.status = ExerciseStatus.FINISHED;
        await this.sessionExercisesRepository.save(currentExercise);

        // Pronađi sledeću vežbu
        const nextExercise = updatedSession.exercises.find(
          (ex) => ex.status === ExerciseStatus.NOT_STARTED,
        );

        if (nextExercise) {
          // Pokreni sledeću vežbu
          nextExercise.status = ExerciseStatus.IN_PROGRESS;
          await this.sessionExercisesRepository.save(nextExercise);
        } else {
          // Nema više vežbi, završi trening automatski
          return await this.finishWorkout(sessionId, userId);
        }
      }
    }

    return await this.findOne(sessionId, userId);
  }

  // Clock Out - Završi trening
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

    // Označi sve preostale vežbe kao finished
    for (const exercise of session.exercises) {
      if (exercise.status !== ExerciseStatus.FINISHED) {
        exercise.status = ExerciseStatus.FINISHED;
        await this.sessionExercisesRepository.save(exercise);
      }
    }

    return await this.sessionsRepository.save(session);
  }

  // Preuzmi sve treninge korisnika
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

  // Preuzmi aktivan trening
  async getActiveWorkout(userId: string): Promise<WorkoutSession | null> {
    return await this.sessionsRepository.findOne({
      where: { userId, isWorkoutFinished: false },
      relations: ['exercises', 'exercises.exercise', 'exercises.sets', 'workoutTemplate'],
      order: {
        exercises: { orderIndex: 'ASC', sets: { setNumber: 'ASC' } },
      },
    });
  }

  // Preuzmi jedan trening
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

  // Obriši trening
  async remove(id: string, userId: string): Promise<void> {
    const session = await this.findOne(id, userId);
    await this.sessionsRepository.remove(session);
  }
}