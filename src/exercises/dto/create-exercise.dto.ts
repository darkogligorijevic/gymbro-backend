import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { MuscleGroup } from '../entities/exercise.entity';

export class CreateExerciseDto {
  @ApiProperty({ example: 'Bench Press' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Klasični potisak na ravnoj klupi', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: MuscleGroup, example: MuscleGroup.CHEST })
  @IsEnum(MuscleGroup)
  muscleGroup: MuscleGroup;

  @ApiProperty({ example: 'https://youtube.com/watch?v=...', required: false })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;
}