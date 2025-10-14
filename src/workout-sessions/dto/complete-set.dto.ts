import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, Min, IsOptional } from 'class-validator';

export class CompleteSetDto {
  @ApiProperty({ 
    example: 'uuid-seta', 
    description: 'ID seta koji završavaš' 
  })
  @IsUUID()
  setId: string;

  @ApiProperty({ 
    example: 8, 
    description: 'Broj ponavljanja koje si uspeo da uradiš' 
  })
  @IsNumber()
  @Min(0)
  actualReps: number;

  @ApiProperty({ 
    example: 82.5, 
    description: 'Stvarna kilaža korišćena (opciono, ako je drugačija od planirane)',
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualWeight?: number;
}