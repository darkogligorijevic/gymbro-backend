import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { WorkoutSession } from '../workout-sessions/entities/workout-session.entity';
import { SessionSet } from '../workout-sessions/entities/session-set.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(WorkoutSession)
    private workoutSessionRepository: Repository<WorkoutSession>,
    @InjectRepository(SessionSet)
    private sessionSetRepository: Repository<SessionSet>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });

    if (existingUser) {
      throw new ConflictException('Korisnik sa ovim email-om ili username-om već postoji');
    }

    const user = this.usersRepository.create({
      ...createUserDto,
      avatarUrl: '/uploads/avatars/default-avatar.png',
    });
    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Korisnik nije pronađen');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async searchUsers(query: string): Promise<User[]> {
    const users = await this.usersRepository.find({
      where: [
        { username: Like(`%${query}%`) },
        { firstName: Like(`%${query}%`) },
        { lastName: Like(`%${query}%`) },
      ],
      select: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'],
      take: 10,
    });
    return users;
  }

  async getUserProfile(userId: string) {
    console.log('🔍 Fetching profile for user:', userId);
    
    try {
      const user = await this.findOne(userId);
      console.log('✅ User found:', user.username);

      // Preuzmi sve treninge korisnika
      const workoutSessions = await this.workoutSessionRepository.find({
        where: { user: { id: userId } },
        relations: ['exercises', 'exercises.exercise', 'exercises.sets', 'workoutTemplate'],
        order: { clockIn: 'DESC' },
      });
      
      console.log(`📊 Found ${workoutSessions.length} workout sessions`);

      // Izračunaj statistike
      const totalWorkouts = workoutSessions.length;
      const completedWorkouts = workoutSessions.filter(w => w.isWorkoutFinished).length;
      
      // Nađi treninge u poslednjih 7 dana za "This Week"
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekWorkouts = workoutSessions.filter(
        w => new Date(w.clockIn) >= oneWeekAgo
      ).length;

      console.log('📈 Stats:', { totalWorkouts, completedWorkouts, thisWeekWorkouts });

      // Izračunaj PR-ove (maksimalne težine po vežbi)
      const exercisePRs = new Map<string, { exerciseName: string; weight: number; date: Date }>();
      
      for (const session of workoutSessions) {
        if (!session.exercises) continue;
        
        for (const sessionExercise of session.exercises) {
          if (!sessionExercise.exercise || !sessionExercise.sets) continue;
          
          const exerciseName = sessionExercise.exercise.name;
          
          for (const set of sessionExercise.sets) {
            if (set.actualWeight && set.isCompleted) {
              const currentPR = exercisePRs.get(exerciseName);
              if (!currentPR || set.actualWeight > currentPR.weight) {
                exercisePRs.set(exerciseName, {
                  exerciseName,
                  weight: set.actualWeight,
                  date: session.clockIn,
                });
              }
            }
          }
        }
      }

      // Uzmi top 4 PR-a
      const topPRs = Array.from(exercisePRs.values())
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 4);

      console.log(`🏆 Found ${topPRs.length} PRs`);

      // Izračunaj najčešće korišćene vežbe
      const exerciseFrequency = new Map<string, { 
        exerciseName: string; 
        exerciseId: string;
        count: number;
        muscleGroup: string;
      }>();

      for (const session of workoutSessions) {
        if (!session.exercises) continue;
        
        for (const sessionExercise of session.exercises) {
          if (!sessionExercise.exercise) continue;
          
          const exerciseId = sessionExercise.exercise.id;
          const exerciseName = sessionExercise.exercise.name;
          const muscleGroup = sessionExercise.exercise.muscleGroup;
          
          const current = exerciseFrequency.get(exerciseId);
          if (current) {
            current.count++;
          } else {
            exerciseFrequency.set(exerciseId, {
              exerciseName,
              exerciseId,
              count: 1,
              muscleGroup,
            });
          }
        }
      }

      const favoriteExercises = Array.from(exerciseFrequency.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      console.log(`💪 Found ${favoriteExercises.length} favorite exercises`);

      // Pripremi kalendar aktivnosti (poslednja 3 meseca)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const recentWorkouts = workoutSessions
        .filter(w => new Date(w.clockIn) >= threeMonthsAgo)
        .map(w => ({
          id: w.id,
          date: w.clockIn,
          templateName: w.workoutTemplate?.name || 'Workout',
          duration: w.durationMinutes,
          isCompleted: w.isWorkoutFinished,
        }));

      console.log(`📅 Found ${recentWorkouts.length} recent workouts`);

      const result = {
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
        stats: {
          totalWorkouts,
          completedWorkouts,
          thisWeekWorkouts,
          topPRs,
          favoriteExercises,
        },
        recentWorkouts,
      };

      console.log('✅ Profile data prepared successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Error in getUserProfile:', error);
      throw error;
    }
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    const user = await this.findOne(id);
    user.avatarUrl = avatarUrl;
    return await this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return await this.usersRepository.save(user);
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Korisnik nije pronađen');
    }

    // Proveri staru lozinku
    const isOldPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('Stara lozinka nije ispravna');
    }

    // Hashuj novu lozinku
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.password = hashedPassword;
    await this.usersRepository.save(user);

    return { message: 'Lozinka uspešno promenjena' };
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
    return { message: 'Nalog uspešno obrisan' };
  }
}