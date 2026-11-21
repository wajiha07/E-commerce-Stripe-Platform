import { DiscountType, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.address.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.shippingMethod.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.storeSetting.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@lunaire.test',
      passwordHash,
      firstName: 'Ava',
      lastName: 'Admin',
      role: Role.ADMIN,
    },
  });

  await prisma.user.create({
    data: {
      email: 'manager@lunaire.test',
      passwordHash,
      firstName: 'Maya',
      lastName: 'Manager',
      role: Role.MANAGER,
    },
  });

  await prisma.user.create({
    data: {
      email: 'support@lunaire.test',
      passwordHash,
      firstName: 'Sam',
      lastName: 'Support',
      role: Role.SUPPORT,
    },
  });

  await prisma.user.create({
    data: {
      email: 'customer@lunaire.test',
      passwordHash,
      firstName: 'Clara',
      lastName: 'Customer',
      role: Role.CUSTOMER,
      phone: '+1 555 0100',
      cart: { create: {} },
    },
  });

  const women = await prisma.category.create({
    data: {
      name: 'Women',
      slug: 'women',
      description: 'Refined silhouettes for every season',
      imageUrl: img('photo-1515372039744-b8f02a3ae446'),
      sortOrder: 1,
    },
  });
  const men = await prisma.category.create({
    data: {
      name: 'Men',
      slug: 'men',
      description: 'Tailored essentials with quiet luxury',
      imageUrl: img('photo-1487222477894-8943e31ffaa6'),
      sortOrder: 2,
    },
  });
  const accessories = await prisma.category.create({
    data: {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Finishing pieces',
      imageUrl: img('photo-1590874103328-eac38a683ce7'),
      sortOrder: 3,
    },
  });

  await prisma.category.createMany({
    data: [
      { name: 'Dresses', slug: 'dresses', parentId: women.id, sortOrder: 1, imageUrl: img('photo-1595777457583-95e059d581b8') },
      { name: 'Outerwear', slug: 'outerwear-women', parentId: women.id, sortOrder: 2, imageUrl: img('photo-1539533018447-63fcce2678e3') },
      { name: 'Tops', slug: 'tops-women', parentId: women.id, sortOrder: 3, imageUrl: img('photo-1564257631407-4deb1f99d992') },
      { name: 'Tailoring', slug: 'tailoring-men', parentId: men.id, sortOrder: 1, imageUrl: img('photo-1594938298603-c8148c4dae35') },
      { name: 'Knitwear', slug: 'knitwear-men', parentId: men.id, sortOrder: 2, imageUrl: img('photo-1576566588028-4147f3842f27') },
      { name: 'Bags', slug: 'bags', parentId: accessories.id, sortOrder: 1, imageUrl: img('photo-1584917865442-de89df76afd3') },
    ],
  });

  const dresses = await prisma.category.findUniqueOrThrow({ where: { slug: 'dresses' } });
  const outerwear = await prisma.category.findUniqueOrThrow({ where: { slug: 'outerwear-women' } });
  const tops = await prisma.category.findUniqueOrThrow({ where: { slug: 'tops-women' } });
  const tailoring = await prisma.category.findUniqueOrThrow({ where: { slug: 'tailoring-men' } });
  const knitwear = await prisma.category.findUniqueOrThrow({ where: { slug: 'knitwear-men' } });
  const bags = await prisma.category.findUniqueOrThrow({ where: { slug: 'bags' } });

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const colors = [
    { color: 'Bone', colorHex: '#F7F4EF' },
    { color: 'Charcoal', colorHex: '#0F0F0F' },
    { color: 'Olive', colorHex: '#3D4A2C' },
  ];

  const products = [
    {
      name: 'Lumen Silk Slip Dress',
      slug: 'lumen-silk-slip-dress',
      description: 'Bias-cut silk with a fluid hem and soft sheen — made for evening light.',
      story: 'Cut from mulberry silk with French seams throughout.',
      categoryId: dresses.id,
      basePrice: 320,
      compareAt: 380,
      isFeatured: true,
      isBestseller: true,
      isNewArrival: false,
      images: [img('photo-1595777457583-95e059d581b8'), img('photo-1515372039744-b8f02a3ae446')],
    },
    {
      name: 'Atelier Wool Coat',
      slug: 'atelier-wool-coat',
      description: 'Double-faced wool overcoat with a clean collar and architectural drape.',
      categoryId: outerwear.id,
      basePrice: 540,
      isFeatured: true,
      isBestseller: true,
      isNewArrival: true,
      images: [img('photo-1539533018447-63fcce2678e3'), img('photo-1548624313-0396c75e4b1a')],
    },
    {
      name: 'Noir Merino Turtleneck',
      slug: 'noir-merino-turtleneck',
      description: 'Fine-gauge merino with a sculptural neckline.',
      categoryId: tops.id,
      basePrice: 180,
      isFeatured: true,
      isBestseller: false,
      isNewArrival: true,
      images: [img('photo-1564257631407-4deb1f99d992')],
    },
    {
      name: 'Cascade Pleat Midi',
      slug: 'cascade-pleat-midi',
      description: 'Soft pleats that move with you — day to night.',
      categoryId: dresses.id,
      basePrice: 290,
      isFeatured: false,
      isBestseller: true,
      isNewArrival: false,
      images: [img('photo-1572804013309-59a88b7e92f1')],
    },
    {
      name: 'Horizon Linen Blazer',
      slug: 'horizon-linen-blazer',
      description: 'Relaxed linen blazer with a soft shoulder.',
      categoryId: outerwear.id,
      basePrice: 360,
      isFeatured: true,
      isBestseller: false,
      isNewArrival: true,
      images: [img('photo-1591047139829-d91aecb6caea')],
    },
    {
      name: 'Soft Column Trouser',
      slug: 'soft-column-trouser',
      description: 'High-rise column trouser in fluid crepe.',
      categoryId: tops.id,
      basePrice: 210,
      isFeatured: false,
      isBestseller: true,
      isNewArrival: false,
      images: [img('photo-1594633312681-425c7b97ccd1')],
    },
    {
      name: 'Eclipse Tailored Suit',
      slug: 'eclipse-tailored-suit',
      description: 'Single-breasted suit in Italian wool with a modern crop.',
      categoryId: tailoring.id,
      basePrice: 780,
      isFeatured: true,
      isBestseller: true,
      isNewArrival: true,
      images: [img('photo-1594938298603-c8148c4dae35'), img('photo-1487222477894-8943e31ffaa6')],
    },
    {
      name: 'Harbor Cashmere Crew',
      slug: 'harbor-cashmere-crew',
      description: 'Featherweight cashmere for everyday luxury.',
      categoryId: knitwear.id,
      basePrice: 260,
      isFeatured: true,
      isBestseller: false,
      isNewArrival: true,
      images: [img('photo-1576566588028-4147f3842f27')],
    },
    {
      name: 'Linea Oxford Shirt',
      slug: 'linea-oxford-shirt',
      description: 'Crisp cotton oxford with mother-of-pearl buttons.',
      categoryId: tailoring.id,
      basePrice: 145,
      isFeatured: false,
      isBestseller: true,
      isNewArrival: false,
      images: [img('photo-1602810318383-e386cc2a3ccf')],
    },
    {
      name: 'Drift Overshirt',
      slug: 'drift-overshirt',
      description: 'Brushed cotton overshirt with a workwear silhouette.',
      categoryId: knitwear.id,
      basePrice: 195,
      isFeatured: false,
      isBestseller: false,
      isNewArrival: true,
      images: [img('photo-1551028719-00167b16eac5')],
    },
    {
      name: 'Solstice Leather Tote',
      slug: 'solstice-leather-tote',
      description: 'Vegetable-tanned leather tote with a structured base.',
      categoryId: bags.id,
      basePrice: 420,
      isFeatured: true,
      isBestseller: true,
      isNewArrival: false,
      images: [img('photo-1584917865442-de89df76afd3')],
    },
    {
      name: 'Arc Minimal Crossbody',
      slug: 'arc-minimal-crossbody',
      description: 'Compact crossbody in pebbled leather.',
      categoryId: bags.id,
      basePrice: 240,
      isFeatured: false,
      isBestseller: false,
      isNewArrival: true,
      images: [img('photo-1590874103328-eac38a683ce7')],
    },
    {
      name: 'Veil Organza Blouse',
      slug: 'veil-organza-blouse',
      description: 'Sheer organza with a soft bow neckline.',
      categoryId: tops.id,
      basePrice: 230,
      isFeatured: true,
      isBestseller: false,
      isNewArrival: true,
      images: [img('photo-1489987707025-afc232f7ea0f')],
    },
    {
      name: 'Studio Denim Jacket',
      slug: 'studio-denim-jacket',
      description: 'Washed indigo denim with tonal stitching.',
      categoryId: outerwear.id,
      basePrice: 275,
      isFeatured: false,
      isBestseller: true,
      isNewArrival: false,
      images: [img('photo-1576995853123-5a10305d93c0')],
    },
    {
      name: 'Paloma Wrap Dress',
      slug: 'paloma-wrap-dress',
      description: 'Fluid wrap dress with a self-tie waist.',
      categoryId: dresses.id,
      basePrice: 310,
      isFeatured: true,
      isBestseller: false,
      isNewArrival: true,
      images: [img('photo-1496747611176-843222e1e57c')],
    },
    {
      name: 'Northfield Field Jacket',
      slug: 'northfield-field-jacket',
      description: 'Technical cotton field jacket with hidden zip.',
      categoryId: outerwear.id,
      basePrice: 390,
      isFeatured: false,
      isBestseller: false,
      isNewArrival: true,
      images: [img('photo-1551488831-00ddcb6c6bd3')],
    },
    {
      name: 'Quiet Luxury Polo',
      slug: 'quiet-luxury-polo',
      description: 'Pima cotton polo with a refined collar.',
      categoryId: knitwear.id,
      basePrice: 125,
      isFeatured: false,
      isBestseller: true,
      isNewArrival: false,
      images: [img('photo-1583743814966-8936f5b7be1a')],
    },
    {
      name: 'Marble Knit Cardigan',
      slug: 'marble-knit-cardigan',
      description: 'Open-front cardigan in marled wool.',
      categoryId: tops.id,
      basePrice: 250,
      isFeatured: false,
      isBestseller: false,
      isNewArrival: true,
      images: [img('photo-1434389677669-e08b4cac3105')],
    },
    {
      name: 'Cipher Slim Trouser',
      slug: 'cipher-slim-trouser',
      description: 'Tapered trouser with a clean crease.',
      categoryId: tailoring.id,
      basePrice: 220,
      isFeatured: true,
      isBestseller: true,
      isNewArrival: false,
      images: [img('photo-1473966968600-fa801b869a1a')],
    },
    {
      name: 'Lunaire Signature Scarf',
      slug: 'lunaire-signature-scarf',
      description: 'Lightweight wool scarf with tonal fringe.',
      categoryId: bags.id,
      basePrice: 95,
      isFeatured: false,
      isBestseller: true,
      isNewArrival: false,
      images: [img('photo-1520903920243-00d872a2d1c9')],
    },
    {
      name: 'Evening Column Gown',
      slug: 'evening-column-gown',
      description: 'Floor-length column with a subtle back slit.',
      categoryId: dresses.id,
      basePrice: 680,
      compareAt: 750,
      isFeatured: true,
      isBestseller: false,
      isNewArrival: true,
      images: [img('photo-1566174053879-31528523f8ae')],
    },
    {
      name: 'Mono Cap Sleeve Tee',
      slug: 'mono-cap-sleeve-tee',
      description: 'Organic cotton tee with a refined drape.',
      categoryId: tops.id,
      basePrice: 75,
      isFeatured: false,
      isBestseller: true,
      isNewArrival: false,
      images: [img('photo-1521572163474-6864f9cf17ab')],
    },
    {
      name: 'Forge Leather Belt',
      slug: 'forge-leather-belt',
      description: 'Italian leather belt with brushed hardware.',
      categoryId: bags.id,
      basePrice: 110,
      isFeatured: false,
      isBestseller: false,
      isNewArrival: true,
      images: [img('photo-1624222247344-550fb60583fd')],
    },
    {
      name: 'Aperture Bomber',
      slug: 'aperture-bomber',
      description: 'Satin bomber with tonal hardware.',
      categoryId: outerwear.id,
      basePrice: 340,
      isFeatured: true,
      isBestseller: false,
      isNewArrival: true,
      images: [img('photo-1551028719-00167b16eac5')],
    },
  ];

  for (const [index, p] of products.entries()) {
    const productSizes = p.categoryId === bags.id ? ['ONESIZE'] : sizes;
    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        story: (p as any).story,
        categoryId: p.categoryId,
        basePrice: p.basePrice,
        compareAt: (p as any).compareAt,
        isFeatured: p.isFeatured,
        isBestseller: p.isBestseller,
        isNewArrival: p.isNewArrival,
        images: {
          create: p.images.map((url, i) => ({
            url,
            alt: p.name,
            sortOrder: i,
          })),
        },
        variants: {
          create: productSizes.flatMap((size) =>
            colors.map((c, ci) => ({
              sku: `${p.slug.slice(0, 8).toUpperCase()}-${size}-${c.color.slice(0, 3).toUpperCase()}-${index}`,
              size,
              color: c.color,
              colorHex: c.colorHex,
              stock: 8 + ((index + ci) % 5),
            })),
          ),
        },
      },
    });
  }

  await prisma.shippingMethod.createMany({
    data: [
      {
        name: 'Standard',
        description: 'Tracked delivery in 5–7 business days',
        price: 8,
        estimatedDaysMin: 5,
        estimatedDaysMax: 7,
        sortOrder: 1,
      },
      {
        name: 'Express',
        description: 'Priority delivery in 2–3 business days',
        price: 18,
        estimatedDaysMin: 2,
        estimatedDaysMax: 3,
        sortOrder: 2,
      },
      {
        name: 'Complimentary',
        description: 'Free shipping on qualifying orders',
        price: 0,
        estimatedDaysMin: 5,
        estimatedDaysMax: 8,
        sortOrder: 3,
      },
    ],
  });

  await prisma.coupon.createMany({
    data: [
      {
        code: 'LUNAIRE10',
        description: '10% off your order',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        minOrderAmount: 100,
        maxUses: 1000,
        isActive: true,
      },
      {
        code: 'WELCOME25',
        description: '$25 off orders over $200',
        discountType: DiscountType.FIXED,
        discountValue: 25,
        minOrderAmount: 200,
        maxUses: 500,
        isActive: true,
      },
    ],
  });

  await prisma.banner.createMany({
    data: [
      {
        title: 'New Season, Soft Light',
        subtitle: 'Editorial essentials for the modern wardrobe',
        imageUrl: img('photo-1469334031218-e382a71b716b'),
        ctaLabel: 'Shop new arrivals',
        ctaHref: '/shop?newArrival=true',
        sortOrder: 0,
        isActive: true,
      },
      {
        title: 'The Atelier Edit',
        subtitle: 'Coats and tailoring cut with intention',
        imageUrl: img('photo-1483985988355-763728e1935b'),
        ctaLabel: 'Explore outerwear',
        ctaHref: '/shop?category=outerwear-women',
        sortOrder: 1,
        isActive: true,
      },
    ],
  });

  await prisma.storeSetting.createMany({
    data: [
      {
        key: 'store',
        value: {
          name: 'LUNAIRE',
          tagline: 'Contemporary fashion, quietly composed',
          email: 'hello@lunaire.test',
          phone: '+1 555 0199',
          address: '120 Mercer Street, New York, NY',
          currency: 'USD',
        },
      },
      {
        key: 'shipping_defaults',
        value: { freeShippingThreshold: 250, taxRate: 0.08 },
      },
    ],
  });

  console.log('Seed complete.');
  console.log('Admin:', admin.email, 'Password123!');
  console.log('Customer: customer@lunaire.test Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
