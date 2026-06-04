import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  // Kategorien
  const [food, drinks] = await Promise.all([
    db.category.upsert({
      where: { id: 'cat-food' },
      update: {},
      create: { id: 'cat-food', name: 'Speisen' },
    }),
    db.category.upsert({
      where: { id: 'cat-drinks' },
      update: {},
      create: { id: 'cat-drinks', name: 'Getränke' },
    }),
  ])

  // Abholzeitslots
  const eventDay = new Date('2026-07-19')
  const slots = await Promise.all([
    db.pickupSlot.upsert({
      where: { id: 'slot-1' },
      update: {},
      create: {
        id: 'slot-1',
        label: '11:00 – 12:00 Uhr',
        startTime: new Date(new Date(eventDay).setHours(11, 0, 0, 0)),
        endTime: new Date(new Date(eventDay).setHours(12, 0, 0, 0)),
        capacity: 50,
      },
    }),
    db.pickupSlot.upsert({
      where: { id: 'slot-2' },
      update: {},
      create: {
        id: 'slot-2',
        label: '12:00 – 13:00 Uhr',
        startTime: new Date(new Date(eventDay).setHours(12, 0, 0, 0)),
        endTime: new Date(new Date(eventDay).setHours(13, 0, 0, 0)),
        capacity: 50,
      },
    }),
    db.pickupSlot.upsert({
      where: { id: 'slot-3' },
      update: {},
      create: {
        id: 'slot-3',
        label: '13:00 – 14:00 Uhr',
        startTime: new Date(new Date(eventDay).setHours(13, 0, 0, 0)),
        endTime: new Date(new Date(eventDay).setHours(14, 0, 0, 0)),
        capacity: 50,
      },
    }),
  ])

  // Produkte
  const products = await Promise.all([
    db.product.upsert({
      where: { id: 'prod-schnitzel' },
      update: {},
      create: {
        id: 'prod-schnitzel',
        name: 'Schnitzel mit Pommes',
        description: 'Klassisches Wiener Schnitzel mit Pommes frites',
        price: 9.5,
        categoryId: food.id,
        available: true,
        maxQuantity: 3,
        allowedSlots: { connect: slots.map((s) => ({ id: s.id })) },
      },
    }),
    db.product.upsert({
      where: { id: 'prod-bratwurst' },
      update: {},
      create: {
        id: 'prod-bratwurst',
        name: 'Bratwurst mit Sauerkraut',
        description: 'Grillbratwurst mit hausgemachtem Sauerkraut',
        price: 5.5,
        categoryId: food.id,
        available: true,
        maxQuantity: 5,
        allowedSlots: { connect: slots.map((s) => ({ id: s.id })) },
      },
    }),
    db.product.upsert({
      where: { id: 'prod-kuchen' },
      update: {},
      create: {
        id: 'prod-kuchen',
        name: 'Kuchenstück (Auswahl)',
        description: 'Auswahl an selbstgebackenen Kuchen',
        price: 2.5,
        categoryId: food.id,
        available: true,
        allowedSlots: { connect: slots.map((s) => ({ id: s.id })) },
      },
    }),
    db.product.upsert({
      where: { id: 'prod-cola' },
      update: {},
      create: {
        id: 'prod-cola',
        name: 'Cola 0,5l',
        price: 2.0,
        categoryId: drinks.id,
        available: true,
        maxQuantity: 6,
        allowedSlots: { connect: slots.map((s) => ({ id: s.id })) },
      },
    }),
    db.product.upsert({
      where: { id: 'prod-wasser' },
      update: {},
      create: {
        id: 'prod-wasser',
        name: 'Mineralwasser 0,5l',
        price: 1.5,
        categoryId: drinks.id,
        available: true,
        maxQuantity: 6,
        allowedSlots: { connect: slots.map((s) => ({ id: s.id })) },
      },
    }),
  ])

  // Beispielbestellungen
  const orderData = [
    { name: 'Max Mustermann', email: 'max@example.com', slotId: 'slot-1', items: [{ productId: 'prod-schnitzel', qty: 2 }, { productId: 'prod-cola', qty: 2 }] },
    { name: 'Erika Musterfrau', email: 'erika@example.com', slotId: 'slot-1', items: [{ productId: 'prod-bratwurst', qty: 1 }, { productId: 'prod-wasser', qty: 1 }] },
    { name: 'Klaus Müller', email: 'klaus@example.com', slotId: 'slot-2', items: [{ productId: 'prod-schnitzel', qty: 1 }, { productId: 'prod-kuchen', qty: 2 }] },
    { name: 'Anna Schmidt', email: 'anna@example.com', slotId: 'slot-2', items: [{ productId: 'prod-bratwurst', qty: 3 }, { productId: 'prod-cola', qty: 3 }] },
    { name: 'Peter Weber', email: 'peter@example.com', slotId: 'slot-3', items: [{ productId: 'prod-kuchen', qty: 1 }, { productId: 'prod-wasser', qty: 2 }] },
    { name: 'Maria Fischer', email: 'maria@example.com', slotId: 'slot-1', items: [{ productId: 'prod-schnitzel', qty: 1 }] },
    { name: 'Hans Wagner', email: 'hans@example.com', slotId: 'slot-3', items: [{ productId: 'prod-bratwurst', qty: 2 }, { productId: 'prod-cola', qty: 1 }] },
    { name: 'Petra Becker', email: 'petra@example.com', slotId: 'slot-2', items: [{ productId: 'prod-kuchen', qty: 3 }] },
    { name: 'Thomas Hoffmann', email: 'thomas@example.com', slotId: 'slot-3', items: [{ productId: 'prod-schnitzel', qty: 2 }, { productId: 'prod-wasser', qty: 2 }] },
    { name: 'Sabine Koch', email: 'sabine@example.com', slotId: 'slot-1', items: [{ productId: 'prod-bratwurst', qty: 1 }, { productId: 'prod-kuchen', qty: 1 }, { productId: 'prod-cola', qty: 2 }] },
  ]

  for (const [i, o] of orderData.entries()) {
    await db.order.upsert({
      where: { id: `order-seed-${i + 1}` },
      update: {},
      create: {
        id: `order-seed-${i + 1}`,
        customerName: o.name,
        email: o.email,
        pickupSlotId: o.slotId,
        status: i < 4 ? 'CONFIRMED' : i === 4 ? 'CANCELLED' : 'PENDING',
        items: {
          create: o.items.map((item) => ({
            productId: item.productId,
            quantity: item.qty,
          })),
        },
      },
    })
  }

  console.log(`✓ ${products.length} Produkte, ${slots.length} Zeitslots, ${orderData.length} Bestellungen`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
