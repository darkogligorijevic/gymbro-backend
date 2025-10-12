import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TemplateExercise } from './template-exercise.entity';

@Entity('template_sets')
export class TemplateSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TemplateExercise, (exercise) => exercise.sets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'templateExerciseId' })
  templateExercise: TemplateExercise;

  @Column()
  templateExerciseId: string;

  @Column()
  setNumber: number; // Broj seta (1, 2, 3...)

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  targetWeight: number; // Planirana kilaža

  @Column()
  targetReps: number; // Planirani broj ponavljanja

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}