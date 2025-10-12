import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutTemplatesService } from './workout-templates.service';
import { WorkoutTemplatesController } from './workout-templates.controller';
import { WorkoutTemplate } from './entities/workout-template.entity';
import { TemplateExercise } from './entities/template-exercise.entity';
import { TemplateSet } from './entities/template-set.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkoutTemplate, TemplateExercise, TemplateSet]),
  ],
  controllers: [WorkoutTemplatesController],
  providers: [WorkoutTemplatesService],
  exports: [WorkoutTemplatesService],
})
export class WorkoutTemplatesModule {}