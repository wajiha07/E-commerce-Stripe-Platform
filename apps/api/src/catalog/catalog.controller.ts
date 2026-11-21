import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ProductQueryDto } from './dto/product.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('products')
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  @Public()
  @Get()
  list(@Query() query: ProductQueryDto) {
    return this.catalog.list(query);
  }

  @Public()
  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.catalog.bySlug(slug);
  }
}
