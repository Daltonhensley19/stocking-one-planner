import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.initializeAdminUser();
  }

  private async initializeAdminUser() {
    try {
      // Check if any users exist
      const userCount = await this.usersRepository.count();

      if (userCount === 0) {
        // Create default admin user
        const username = 'admin';
        const password = 'gowalmart';
        const hashedPassword = await bcrypt.hash(password, 10);

        const adminUser = this.usersRepository.create({
          username,
          password: hashedPassword,
        });

        await this.usersRepository.save(adminUser);

        console.log('✓ Default admin user created successfully!');
        console.log(`  Username: ${username}`);
        console.log(`  Password: ${password}`);
        console.log('\nIMPORTANT: Change the default password after first login!');
      }
    } catch (error) {
      console.error('Error initializing admin user:', error.message);
    }
  }
}
