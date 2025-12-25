import { Injectable } from '@nestjs/common';
import { SlotsRepository } from './slots.repository';

@Injectable()
export class SlotsService {
  constructor(private readonly slotsRepository: SlotsRepository) {}
}
