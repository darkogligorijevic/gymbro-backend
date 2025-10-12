import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTemplateSetDto {
  @ApiProperty({ example: 80, description: 'Planirana kilaža u kg' })
  @IsNumber()
  @Min(0)
  targetWeight: number;

  @ApiProperty({ example: 8, description: 'Planirani broj ponavljanja' })
  @IsNumber()
  @Min(1)
  targetReps: number;
}

export class CreateTemplateExerciseDto {
  @ApiProperty({ example: 'uuid-vezbe' })
  @IsUUID()
  exerciseId: string;

  @ApiProperty({ type: [CreateTemplateSetDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateSetDto)
  sets: CreateTemplateSetDto[];

  @ApiProperty({ example: 'Pauza 90 sekundi', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateWorkoutTemplateDto {
  @ApiProperty({ example: 'Push Day A' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Trening za grudi, ramena i triceps', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [CreateTemplateExerciseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateExerciseDto)
  exercises: CreateTemplateExerciseDto[];
}