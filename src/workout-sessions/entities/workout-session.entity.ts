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
import { User } from '../../users/entities/user.entity';
import { WorkoutTemplate } from '../../workout-templates/entities/workout-template.entity';
import { SessionExercise } from './session-exercise.entity';

@Entity('workout_sessions')
export class WorkoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.workoutSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => WorkoutTemplate, { nullable: true })
  @JoinColumn({ name: 'workoutTemplateId' })
  workoutTemplate: WorkoutTemplate;

  @Column({ nullable: true })
  workoutTemplateId: string;

  @Column({ type: 'datetime' })
  clockIn: Date; // Početak treninga

  @Column({ type: 'datetime', nullable: true })
  clockOut: Date; // Kraj treninga

  @Column({ default: false })
  isWorkoutFinished: boolean;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number; // Trajanje u minutama (izračunava se kada se završi)

  @OneToMany(() => SessionExercise, (exercise) => exercise.workoutSession, {
    cascade: true,
    eager: true,
  })
  exercises: SessionExercise[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}