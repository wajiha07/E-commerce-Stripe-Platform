import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private cartInclude = {
    items: {
      include: {
        variant: {
          include: {
            product: {
              include: { images: { orderBy: { sortOrder: 'asc' as const }, take: 1 } },
            },
          },
        },
      },
    },
  };

  async getOrCreate(userId?: string, guestId?: string) {
    if (userId) {
      let cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: this.cartInclude,
      });
      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId },
          include: this.cartInclude,
        });
      }
      return this.serialize(cart);
    }
    if (!guestId) throw new BadRequestException('guestId required for guest cart');
    let cart = await this.prisma.cart.findUnique({
      where: { guestId },
      include: this.cartInclude,
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { guestId },
        include: this.cartInclude,
      });
    }
    return this.serialize(cart);
  }

  private serialize(cart: Awaited<ReturnType<typeof this.prisma.cart.findUnique>> & object) {
    const items = (cart as any).items.map((item: any) => {
      const price = Number(item.variant.price ?? item.variant.product.basePrice);
      return {
        id: item.id,
        quantity: item.quantity,
        variantId: item.variantId,
        size: item.variant.size,
        color: item.variant.color,
        colorHex: item.variant.colorHex,
        stock: item.variant.stock,
        sku: item.variant.sku,
        price,
        lineTotal: price * item.quantity,
        product: {
          id: item.variant.product.id,
          name: item.variant.product.name,
          slug: item.variant.product.slug,
          imageUrl: item.variant.product.images[0]?.url ?? null,
        },
      };
    });
    const subtotal = items.reduce((s: number, i: any) => s + i.lineTotal, 0);
    return {
      id: (cart as any).id,
      guestId: (cart as any).guestId,
      items,
      subtotal,
      itemCount: items.reduce((s: number, i: any) => s + i.quantity, 0),
    };
  }

  async addItem(userId: string | undefined, guestId: string | undefined, variantId: string, quantity: number) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!variant || !variant.isActive || !variant.product.isActive) {
      throw new NotFoundException('Variant not found');
    }
    if (variant.stock < quantity) throw new BadRequestException('Insufficient stock');

    const cart = await this.ensureCart(userId, guestId);
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });
    const nextQty = (existing?.quantity || 0) + quantity;
    if (variant.stock < nextQty) throw new BadRequestException('Insufficient stock');

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, variantId, quantity },
      });
    }
    return this.getOrCreate(userId, guestId || cart.guestId || undefined);
  }

  async updateItem(
    userId: string | undefined,
    guestId: string | undefined,
    itemId: string,
    quantity: number,
  ) {
    const cart = await this.ensureCart(userId, guestId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { variant: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    if (item.variant.stock < quantity) throw new BadRequestException('Insufficient stock');
    await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    return this.getOrCreate(userId, guestId || cart.guestId || undefined);
  }

  async removeItem(userId: string | undefined, guestId: string | undefined, itemId: string) {
    const cart = await this.ensureCart(userId, guestId);
    await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    return this.getOrCreate(userId, guestId || cart.guestId || undefined);
  }

  async clear(userId: string | undefined, guestId: string | undefined) {
    const cart = await this.ensureCart(userId, guestId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getOrCreate(userId, guestId || cart.guestId || undefined);
  }

  async mergeGuestCart(userId: string, guestId: string) {
    const guestCart = await this.prisma.cart.findUnique({
      where: { guestId },
      include: { items: true },
    });
    if (!guestCart?.items.length) return this.getOrCreate(userId);
    const userCart = await this.ensureCart(userId);
    for (const item of guestCart.items) {
      await this.addItem(userId, undefined, item.variantId, item.quantity);
    }
    await this.prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
    return this.getOrCreate(userId);
  }

  private async ensureCart(userId?: string, guestId?: string) {
    if (userId) {
      return (
        (await this.prisma.cart.findUnique({ where: { userId } })) ||
        (await this.prisma.cart.create({ data: { userId } }))
      );
    }
    if (!guestId) throw new BadRequestException('guestId required');
    return (
      (await this.prisma.cart.findUnique({ where: { guestId } })) ||
      (await this.prisma.cart.create({ data: { guestId } }))
    );
  }
}
