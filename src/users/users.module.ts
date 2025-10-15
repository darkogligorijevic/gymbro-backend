import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { WorkoutSession } from '../workout-sessions/entities/workout-session.entity';
import { SessionSet } from '../workout-sessions/entities/session-set.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, WorkoutSession, SessionSet]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}