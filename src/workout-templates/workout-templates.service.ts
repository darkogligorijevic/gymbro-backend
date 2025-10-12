import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutTemplate } from './entities/workout-template.entity';
import { TemplateExercise } from './entities/template-exercise.entity';
import { TemplateSet } from './entities/template-set.entity';
import { CreateWorkoutTemplateDto } from './dto/create-workout-template.dto';
import { UpdateWorkoutTemplateDto } from './dto/update-workout-template.dto';

@Injectable()
export class WorkoutTemplatesService {
  constructor(
    @InjectRepository(WorkoutTemplate)
    private templatesRepository: Repository<WorkoutTemplate>,
    @InjectRepository(TemplateExercise)
    private templateExercisesRepository: Repository<TemplateExercise>,
    @InjectRepository(TemplateSet)
    private templateSetsRepository: Repository<TemplateSet>,
  ) {}

  async create(
    userId: string,
    createDto: CreateWorkoutTemplateDto,
  ): Promise<WorkoutTemplate> {
    const template = this.templatesRepository.create({
      ...createDto,
      userId,
      exercises: createDto.exercises.map((exercise, index) => ({
        ...exercise,
        orderIndex: index,
        sets: exercise.sets.map((set, setIndex) => ({
          ...set,
          setNumber: setIndex + 1,
        })),
      })),
    });

    return await this.templatesRepository.save(template);
  }

  async findAll(userId: string): Promise<WorkoutTemplate[]> {
    return await this.templatesRepository.find({
      where: { userId },
      relations: ['exercises', 'exercises.exercise', 'exercises.sets'],
      order: {
        createdAt: 'DESC',
        exercises: { orderIndex: 'ASC', sets: { setNumber: 'ASC' } },
      },
    });
  }

  async findOne(id: string, userId: string): Promise<WorkoutTemplate> {
    const template = await this.templatesRepository.findOne({
      where: { id },
      relations: ['exercises', 'exercises.exercise', 'exercises.sets'],
    });

    if (!template) {
      throw new NotFoundException('Šablon treninga nije pronađen');
    }

    if (template.userId !== userId) {
      throw new ForbiddenException('Nemate pristup ovom šablonu treninga');
    }

    return template;
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateWorkoutTemplateDto,
  ): Promise<WorkoutTemplate> {
    const template = await this.findOne(id, userId);

    // Obriši stare vežbe ako postoje nove
    if (updateDto.exercises) {
      await this.templateExercisesRepository.delete({
        workoutTemplateId: id,
      });

      template.exercises = updateDto.exercises.map((exercise, index) => ({
        ...exercise,
        orderIndex: index,
        workoutTemplateId: id,
        sets: exercise.sets.map((set, setIndex) => ({
          ...set,
          setNumber: setIndex + 1,
        })),
      } as TemplateExercise));
    }

    Object.assign(template, {
      name: updateDto.name ?? template.name,
      description: updateDto.description ?? template.description,
    });

    return await this.templatesRepository.save(template);
  }

  async remove(id: string, userId: string): Promise<void> {
    const template = await this.findOne(id, userId);
    await this.templatesRepository.remove(template);
  }
}