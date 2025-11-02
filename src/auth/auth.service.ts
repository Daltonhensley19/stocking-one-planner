import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { username } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Account locked. Try again in ${remainingMinutes} minute(s).`
      );
    }

    // Reset login attempts if lock time has passed
    if (user.lockedUntil && new Date() >= user.lockedUntil) {
      user.loginAttempts = 0;
      user.lockedUntil = null;
      await this.usersRepository.save(user);
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts += 1;

      // Lock account if max attempts reached
      if (user.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + this.LOCK_TIME);
        await this.usersRepository.save(user);
        throw new UnauthorizedException(
          'Too many failed login attempts. Account locked for 15 minutes.'
        );
      }

      await this.usersRepository.save(user);
      const attemptsLeft = this.MAX_LOGIN_ATTEMPTS - user.loginAttempts;
      throw new UnauthorizedException(
        `Invalid credentials. ${attemptsLeft} attempt(s) remaining.`
      );
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockedUntil = null;
      await this.usersRepository.save(user);
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(username: string, password: string, rememberMe: boolean = false) {
    const user = await this.validateUser(username, password);

    const payload = { username: user.username, sub: user.id };

    // Set expiration: 15 minutes standard, 7 days for remember me
    const expiresIn = rememberMe ? '7d' : '15m';

    return {
      access_token: this.jwtService.sign(payload, { expiresIn }),
      expiresIn: rememberMe ? '7 days' : '15 minutes',
    };
  }

  async createUser(username: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      username,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }
}
