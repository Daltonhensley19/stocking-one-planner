import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Associate } from '../entities/associate.entity';

@Injectable()
export class AssociatesService {
  constructor(
    @InjectRepository(Associate)
    private associatesRepository: Repository<Associate>,
  ) {}

  async findAll(): Promise<Associate[]> {
    return this.associatesRepository.find({
      order: { createdAt: 'ASC' },
    });
  }

  async create(name: string): Promise<Associate> {
    // Check if associate already exists
    const existing = await this.associatesRepository.findOne({ where: { name } });
    if (existing) {
      throw new ConflictException('Associate already exists');
    }

    const associate = this.associatesRepository.create({ name });
    return this.associatesRepository.save(associate);
  }

  async remove(id: number): Promise<void> {
    const result = await this.associatesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Associate not found');
    }
  }
}
