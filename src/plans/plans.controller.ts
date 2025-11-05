import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { PlansService } from './plans.service';
import { Plan } from '../entities/plan.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async findAll(): Promise<Plan[]> {
    return this.plansService.findAll();
  }

  @Get('by-date')
  async findByDate(@Query('date') date: string): Promise<Plan | null> {
    return this.plansService.findByDate(new Date(date));
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Plan> {
    return this.plansService.findById(+id);
  }

  @Post()
  async create(
    @Body('planDate') planDate: string,
    @Body('assignments') assignments: Record<string, Array<{ type: 'predefined' | 'custom'; value: string | number }>>,
  ): Promise<Plan> {
    return this.plansService.create(new Date(planDate), assignments);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body('assignments') assignments: Record<string, Array<{ type: 'predefined' | 'custom'; value: string | number }>>,
    @Body('isCompleted') isCompleted?: boolean,
  ): Promise<Plan> {
    return this.plansService.update(+id, assignments, isCompleted);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.plansService.remove(+id);
  }
}
