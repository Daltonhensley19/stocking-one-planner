import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssociatesController } from './associates.controller';
import { AssociatesService } from './associates.service';
import { Associate } from '../entities/associate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Associate])],
  controllers: [AssociatesController],
  providers: [AssociatesService],
})
export class AssociatesModule {}
