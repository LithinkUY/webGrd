const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const adminPassword = await hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@tiendatech.uy' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@tiendatech.uy',
      password: adminPassword,
      role: 'admin',
    },
  });
  console.log('Admin user created: admin@tiendatech.uy / admin123');

  // Brands
  const brands = [
    { name: 'Lenovo', slug: 'lenovo' },
    { name: 'HP', slug: 'hp' },
    { name: 'Dell', slug: 'dell' },
    { name: 'Samsung', slug: 'samsung' },
    { name: 'LG', slug: 'lg' },
    { name: 'Logitech', slug: 'logitech' },
    { name: 'Kingston', slug: 'kingston' },
    { name: 'TP-Link', slug: 'tp-link' },
    { name: 'ASUS', slug: 'asus' },
    { name: 'Epson', slug: 'epson' },
  ];
  const brandMap = {};
  for (const b of brands) {
    const brand = await prisma.brand.upsert({ where: { slug: b.slug }, update: {}, create: b });
    brandMap[b.slug] = brand.id;
  }
  console.log('Brands created');

  // Categories
  const categories = [
    { name: 'Notebooks', slug: 'notebooks', sortOrder: 1 },
    { name: 'PC Escritorio', slug: 'pc-escritorio', sortOrder: 2 },
    { name: 'Monitores', slug: 'monitores', sortOrder: 3 },
    { name: 'Perifericos', slug: 'perifericos', sortOrder: 4 },
    { name: 'Componentes', slug: 'componentes', sortOrder: 5 },
    { name: 'Redes', slug: 'redes', sortOrder: 6 },
    { name: 'Impresoras', slug: 'impresoras', sortOrder: 7 },
    { name: 'Accesorios', slug: 'accesorios', sortOrder: 8 },
  ];
  const catMap = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
    catMap[c.slug] = cat.id;
  }
  console.log('Categories created');

  // Products
  const products = [
    { name: 'Notebook Lenovo IdeaPad 3 15.6 i5 8GB 512GB SSD', slug: 'notebook-lenovo-ideapad-3', sku: 'NB-LNV-001', price: 899, comparePrice: 1099, stock: 15, isNew: true, featured: true, categoryId: catMap['notebooks'], brandId: brandMap['lenovo'], shortDesc: 'Procesador Intel Core i5, 8GB RAM, 512GB SSD, pantalla 15.6 Full HD', specs: JSON.stringify({ Procesador: 'Intel Core i5-1235U', RAM: '8GB DDR4', Almacenamiento: '512GB SSD NVMe', Pantalla: '15.6 Full HD IPS', 'Sistema Operativo': 'Windows 11 Home' }) },
    { name: 'Notebook HP 250 G9 15.6 i3 8GB 256GB SSD', slug: 'notebook-hp-250-g9', sku: 'NB-HP-001', price: 599, comparePrice: null, stock: 20, isNew: false, featured: false, categoryId: catMap['notebooks'], brandId: brandMap['hp'], shortDesc: 'Intel Core i3, 8GB RAM, 256GB SSD, ideal para trabajo y estudio' },
    { name: 'Notebook Dell Inspiron 14 Ryzen 5 16GB 512GB', slug: 'notebook-dell-inspiron-14', sku: 'NB-DLL-001', price: 1099, comparePrice: 1299, stock: 8, isNew: true, featured: true, categoryId: catMap['notebooks'], brandId: brandMap['dell'] },
    { name: 'Monitor Samsung 24 Full HD IPS 75Hz', slug: 'monitor-samsung-24-fhd', sku: 'MN-SAM-001', price: 249, comparePrice: null, stock: 12, isNew: false, featured: true, categoryId: catMap['monitores'], brandId: brandMap['samsung'] },
    { name: 'Monitor LG UltraWide 29 IPS HDR10', slug: 'monitor-lg-ultrawide-29', sku: 'MN-LG-001', price: 349, comparePrice: null, stock: 5, isNew: true, featured: true, categoryId: catMap['monitores'], brandId: brandMap['lg'] },
    { name: 'Monitor ASUS ProArt 27 4K IPS', slug: 'monitor-asus-proart-27', sku: 'MN-ASU-001', price: 499, comparePrice: 599, stock: 3, isNew: true, featured: false, categoryId: catMap['monitores'], brandId: brandMap['asus'] },
    { name: 'Teclado Mecanico Logitech G413 RGB', slug: 'teclado-logitech-g413', sku: 'PR-LOG-001', price: 89, comparePrice: 119, stock: 25, isNew: true, featured: true, categoryId: catMap['perifericos'], brandId: brandMap['logitech'] },
    { name: 'Mouse Logitech MX Master 3S Wireless', slug: 'mouse-logitech-mx-master-3s', sku: 'PR-LOG-002', price: 99, comparePrice: 129, stock: 12, isNew: true, featured: false, categoryId: catMap['perifericos'], brandId: brandMap['logitech'] },
    { name: 'SSD Kingston NV2 1TB NVMe M.2 PCIe', slug: 'ssd-kingston-nv2-1tb', sku: 'CP-KNG-001', price: 79, comparePrice: null, stock: 50, isNew: false, featured: true, categoryId: catMap['componentes'], brandId: brandMap['kingston'] },
    { name: 'Memoria RAM Kingston Fury 16GB DDR4 3200MHz', slug: 'ram-kingston-fury-16gb', sku: 'CP-KNG-002', price: 55, comparePrice: 69, stock: 35, isNew: false, featured: false, categoryId: catMap['componentes'], brandId: brandMap['kingston'] },
    { name: 'Router TP-Link Archer AX23 WiFi 6 AX1800', slug: 'router-tplink-archer-ax23', sku: 'RD-TPL-001', price: 65, comparePrice: 85, stock: 30, isNew: false, featured: false, categoryId: catMap['redes'], brandId: brandMap['tp-link'] },
    { name: 'Switch TP-Link 8 Puertos Gigabit', slug: 'switch-tplink-8-puertos', sku: 'RD-TPL-002', price: 29, comparePrice: null, stock: 40, isNew: false, featured: false, categoryId: catMap['redes'], brandId: brandMap['tp-link'] },
    { name: 'Impresora Epson EcoTank L3250 WiFi', slug: 'impresora-epson-l3250', sku: 'IM-EPS-001', price: 299, comparePrice: 349, stock: 10, isNew: false, featured: true, categoryId: catMap['impresoras'], brandId: brandMap['epson'] },
    { name: 'Webcam Logitech C920 HD Pro 1080p', slug: 'webcam-logitech-c920', sku: 'AC-LOG-001', price: 79, comparePrice: null, stock: 18, isNew: false, featured: false, categoryId: catMap['accesorios'], brandId: brandMap['logitech'] },
    { name: 'Notebook ASUS VivoBook 15 Ryzen 7 16GB 512GB', slug: 'notebook-asus-vivobook-15', sku: 'NB-ASU-001', price: 999, comparePrice: null, stock: 6, isNew: true, featured: true, categoryId: catMap['notebooks'], brandId: brandMap['asus'] },
    { name: 'Auriculares Logitech H390 USB', slug: 'auriculares-logitech-h390', sku: 'AC-LOG-002', price: 39, comparePrice: 49, stock: 22, isNew: false, featured: false, categoryId: catMap['accesorios'], brandId: brandMap['logitech'] },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: { ...p, images: '[]' },
    });
  }
  console.log(products.length + ' products created');

  console.log('Seed completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
