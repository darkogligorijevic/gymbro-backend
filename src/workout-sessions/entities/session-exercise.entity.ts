import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { WorkoutSession } from './workout-session.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';
import { SessionSet } from './session-set.entity';

export enum ExerciseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
}

@Entity('session_exercises')
export class SessionExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkoutSession, (session) => session.exercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workoutSessionId' })
  workoutSession: WorkoutSession;

  @Column()
  workoutSessionId: string;

  @ManyToOne(() => Exercise, { eager: true })
  @JoinColumn({ name: 'exerciseId' })
  exercise: Exercise;

  @Column()
  exerciseId: string;

  @Column()
  orderIndex: number;

  @Column({
    type: 'enum',
    enum: ExerciseStatus,
    default: ExerciseStatus.NOT_STARTED,
  })
  status: ExerciseStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => SessionSet, (set) => set.sessionExercise, {
    cascade: true,
    eager: true,
  })
  sets: SessionSet[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}