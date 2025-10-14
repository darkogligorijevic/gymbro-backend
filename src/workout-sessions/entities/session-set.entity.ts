import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SessionExercise } from './session-exercise.entity';

@Entity('session_sets')
export class SessionSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SessionExercise, (exercise) => exercise.sets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionExerciseId' })
  sessionExercise: SessionExercise;

  @Column()
  sessionExerciseId: string;

  @Column()
  setNumber: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  targetWeight: number; // Planirana kilaža

  @Column()
  targetReps: number; // Planirani broj ponavljanja

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  actualWeight?: number; // Stvarna kilaža (ako je drugačija)

  @Column({ type: 'int', nullable: true })
  actualReps?: number; // Stvarno urađeni broj ponavljanja

  @Column({ default: false })
  isCompleted: boolean; // Da li je set završen

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}