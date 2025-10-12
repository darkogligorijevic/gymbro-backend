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
import { WorkoutTemplate } from './workout-template.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';
import { TemplateSet } from './template-set.entity';

@Entity('template_exercises')
export class TemplateExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkoutTemplate, (template) => template.exercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workoutTemplateId' })
  workoutTemplate: WorkoutTemplate;

  @Column()
  workoutTemplateId: string;

  @ManyToOne(() => Exercise, { eager: true })
  @JoinColumn({ name: 'exerciseId' })
  exercise: Exercise;

  @Column()
  exerciseId: string;

  @Column()
  orderIndex: number; // Redosled vežbi u treningu

  @Column({ type: 'text', nullable: true })
  notes: string; // Napomene za vežbu

  @OneToMany(() => TemplateSet, (set) => set.templateExercise, {
    cascade: true,
    eager: true,
  })
  sets: TemplateSet[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}