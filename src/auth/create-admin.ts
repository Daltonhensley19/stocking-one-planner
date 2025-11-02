import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from './auth.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  try {
    const user = await authService.createUser(username, password);
    console.log(`✓ Admin user created successfully!`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Password: ${password}`);
    console.log(`\nIMPORTANT: Change the default password after first login!`);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      console.log('Admin user already exists.');
    } else {
      console.error('Error creating admin user:', error.message);
    }
  }

  await app.close();
}

bootstrap();
