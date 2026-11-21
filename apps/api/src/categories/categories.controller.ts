import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private categories: CategoriesService) {}

  @Public()
  @Get()
  list() {
    return this.categories.listPublic();
  }
}
