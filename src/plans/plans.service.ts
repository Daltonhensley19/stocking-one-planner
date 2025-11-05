import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../entities/plan.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private plansRepository: Repository<Plan>,
  ) {}

  async findAll(): Promise<Plan[]> {
    return this.plansRepository.find({
      order: { planDate: 'DESC' },
    });
  }

  async findByDate(date: Date): Promise<Plan | null> {
    return this.plansRepository.findOne({
      where: { planDate: date },
    });
  }

  async findById(id: number): Promise<Plan> {
    const plan = await this.plansRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  async create(planDate: Date, assignments: Record<string, Array<{ type: 'predefined' | 'custom'; value: string | number }>>): Promise<Plan> {
    const plan = this.plansRepository.create({
      planDate,
      assignments,
      isCompleted: false,
    });
    return this.plansRepository.save(plan);
  }

  async update(id: number, assignments: Record<string, Array<{ type: 'predefined' | 'custom'; value: string | number }>>, isCompleted?: boolean): Promise<Plan> {
    const plan = await this.findById(id);

    plan.assignments = assignments;
    if (isCompleted !== undefined) {
      plan.isCompleted = isCompleted;
    }

    return this.plansRepository.save(plan);
  }

  async remove(id: number): Promise<void> {
    const result = await this.plansRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Plan not found');
    }
  }
}
