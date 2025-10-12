import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutSessionsService } from './workout-sessions.service';
import { WorkoutSessionsController } from './workout-sessions.controller';
import { WorkoutSession } from './entities/workout-session.entity';
import { SessionExercise } from './entities/session-exercise.entity';
import { SessionSet } from './entities/session-set.entity';
import { WorkoutTemplatesModule } from '../workout-templates/workout-templates.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkoutSession, SessionExercise, SessionSet]),
    WorkoutTemplatesModule,
  ],
  controllers: [WorkoutSessionsController],
  providers: [WorkoutSessionsService],
})
export class WorkoutSessionsModule {}