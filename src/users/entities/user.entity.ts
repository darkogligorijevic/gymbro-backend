import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { WorkoutTemplate } from '../../workout-templates/entities/workout-template.entity';
import { WorkoutSession } from '../../workout-sessions/entities/workout-session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @OneToMany(() => WorkoutTemplate, (template) => template.user)
  workoutTemplates: WorkoutTemplate[];

  @OneToMany(() => WorkoutSession, (session) => session.user)
  workoutSessions: WorkoutSession[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}