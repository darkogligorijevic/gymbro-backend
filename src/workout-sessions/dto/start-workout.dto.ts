import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class StartWorkoutDto {
  @ApiProperty({ 
    example: 'uuid-template-a', 
    description: 'ID šablona treninga koji želiš da pokreneš' 
  })
  @IsUUID()
  workoutTemplateId: string;
}