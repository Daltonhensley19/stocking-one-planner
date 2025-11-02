import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AssociatesService } from './associates.service';
import { Associate } from '../entities/associate.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/associates')
@UseGuards(JwtAuthGuard)
export class AssociatesController {
  constructor(private readonly associatesService: AssociatesService) {}

  @Get()
  async findAll(): Promise<Associate[]> {
    return this.associatesService.findAll();
  }

  @Post()
  async create(@Body('name') name: string): Promise<Associate> {
    return this.associatesService.create(name);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.associatesService.remove(+id);
  }
}
