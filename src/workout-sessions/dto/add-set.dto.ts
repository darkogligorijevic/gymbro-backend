import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, Min } from 'class-validator';

export class AddSetDto {
  @ApiProperty({ 
    example: 'uuid-exercise', 
    description: 'ID vežbe kojoj dodaješ set' 
  })
  @IsUUID()
  exerciseId: string;

  @ApiProperty({ 
    example: 80, 
    description: 'Planirana kilaža' 
  })
  @IsNumber()
  @Min(0)
  targetWeight: number;

  @ApiProperty({ 
    example: 8, 
    description: 'Planirani broj ponavljanja' 
  })
  @IsNumber()
  @Min(1)
  targetReps: number;
}