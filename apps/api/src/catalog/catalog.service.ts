import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, ProductQueryDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  private slugify(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private productInclude = {
    images: { orderBy: { sortOrder: 'asc' as const } },
    variants: { where: { isActive: true }, orderBy: { size: 'asc' as const } },
    category: true,
    seller: {
      select: {
        id: true,
        storeName: true,
        storeSlug: true,
        status: true,
      },
    },
  };

  async list(query: ProductQueryDto, admin = false) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 12, 48);
    const where: Prisma.ProductWhereInput = {
      ...(admin ? {} : { isActive: true }),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.category
        ? {
            OR: [
              { category: { slug: query.category } },
              { category: { parent: { slug: query.category } } },
            ],
          }
        : {}),
      ...(query.minPrice != null || query.maxPrice != null
        ? {
            basePrice: {
              ...(query.minPrice != null ? { gte: query.minPrice } : {}),
              ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
      ...(query.featured === 'true' ? { isFeatured: true } : {}),
      ...(query.bestseller === 'true' ? { isBestseller: true } : {}),
      ...(query.newArrival === 'true' ? { isNewArrival: true } : {}),
      ...(query.sellerId ? { sellerId: query.sellerId } : {}),
      ...(query.seller ? { seller: { storeSlug: query.seller } } : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { basePrice: 'asc' }
        : query.sort === 'price_desc'
          ? { basePrice: 'desc' }
          : query.sort === 'name'
            ? { name: 'asc' }
            : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: this.productInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async bySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: this.productInclude,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async byId(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: [{ color: 'asc' }, { size: 'asc' }] },
        category: true,
        seller: {
          select: { id: true, storeName: true, storeSlug: true, status: true },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto & { sellerId?: string }) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug || this.slugify(dto.name),
        description: dto.description,
        story: dto.story,
        categoryId: dto.categoryId,
        sellerId: dto.sellerId,
        basePrice: dto.basePrice,
        compareAt: dto.compareAt,
        isFeatured: dto.isFeatured ?? false,
        isBestseller: dto.isBestseller ?? false,
        isNewArrival: dto.isNewArrival ?? false,
        isActive: dto.isActive ?? true,
        images: dto.images?.length
          ? { create: dto.images.map((img, i) => ({ ...img, sortOrder: img.sortOrder ?? i })) }
          : undefined,
        variants: dto.variants?.length ? { create: dto.variants } : undefined,
      },
      include: this.productInclude,
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.byId(id);
    const { variants, images, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (variants) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        await tx.productVariant.createMany({
          data: variants.map((v) => ({ ...v, productId: id })),
        });
      }
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: images.map((img, i) => ({
            productId: id,
            url: img.url,
            alt: img.alt,
            sortOrder: img.sortOrder ?? i,
          })),
        });
      }
      return tx.product.update({
        where: { id },
        data: rest,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          variants: true,
          category: true,
        },
      });
    });
  }

  async remove(id: string) {
    await this.byId(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
