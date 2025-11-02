import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssociatesModule } from './associates/associates.module';
import { AuthModule } from './auth/auth.module';
import { Associate } from './entities/associate.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data.db',
      entities: [Associate, User],
      synchronize: true, // Auto-create tables (disable in production)
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),
    AuthModule,
    AssociatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
