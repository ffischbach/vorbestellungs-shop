import type { ShopImportData } from '@repo/config'
import { db } from '../index'
import type { Prisma } from '@prisma/client'

export type ShopImportSummary = {
  categoriesCreated: number
  categoriesUpdated: number
  slotsCreated: number
  slotsUpdated: number
  productsCreated: number
  productsUpdated: number
}

type ShopImportPreviewEntry = { key: string; status: 'neu' | 'aktualisiert' }
export type ShopImportPreview = {
  categories: ShopImportPreviewEntry[]
  slots: ShopImportPreviewEntry[]
  products: ShopImportPreviewEntry[]
}

// INV-08: Matching per Name/Label statt Unique-Constraint — siehe docs/domain/invariants.md
export async function previewShopImport(data: ShopImportData): Promise<ShopImportPreview> {
  const [existingCategories, existingSlots, existingProducts] = await Promise.all([
    db.category.findMany({ select: { name: true } }),
    db.pickupSlot.findMany({ select: { label: true } }),
    db.product.findMany({ select: { name: true, category: { select: { name: true } } } }),
  ])
  const categoryNames = new Set(existingCategories.map((c) => c.name))
  const slotLabels = new Set(existingSlots.map((s) => s.label))
  const productKeys = new Set(existingProducts.map((p) => `${p.category.name}::${p.name}`))

  return {
    categories: data.categories.map((c) => ({
      key: c.name,
      status: categoryNames.has(c.name) ? 'aktualisiert' : 'neu',
    })),
    slots: data.slots.map((s) => ({
      key: s.label,
      status: slotLabels.has(s.label) ? 'aktualisiert' : 'neu',
    })),
    products: data.products.map((p) => ({
      key: `${p.categoryName} / ${p.name}`,
      status: productKeys.has(`${p.categoryName}::${p.name}`) ? 'aktualisiert' : 'neu',
    })),
  }
}

// INV-08: Matching per Name/Label statt Unique-Constraint — siehe docs/domain/invariants.md
export async function importShopData(data: ShopImportData): Promise<ShopImportSummary> {
  return db.$transaction(async (tx) => {
    const summary: ShopImportSummary = {
      categoriesCreated: 0,
      categoriesUpdated: 0,
      slotsCreated: 0,
      slotsUpdated: 0,
      productsCreated: 0,
      productsUpdated: 0,
    }

    const categoryIdByName = new Map<string, string>()
    for (const category of data.categories) {
      const existing = await tx.category.findFirst({ where: { name: category.name } })
      if (existing) {
        summary.categoriesUpdated++
        categoryIdByName.set(category.name, existing.id)
      } else {
        const created = await tx.category.create({ data: { name: category.name } })
        summary.categoriesCreated++
        categoryIdByName.set(category.name, created.id)
      }
    }

    const slotIdByLabel = new Map<string, string>()
    for (const slot of data.slots) {
      const slotData: Prisma.PickupSlotUpdateInput = {
        label: slot.label,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
        capacity: slot.capacity ?? null,
      }
      const existing = await tx.pickupSlot.findFirst({ where: { label: slot.label } })
      if (existing) {
        await tx.pickupSlot.update({ where: { id: existing.id }, data: slotData })
        summary.slotsUpdated++
        slotIdByLabel.set(slot.label, existing.id)
      } else {
        const created = await tx.pickupSlot.create({ data: slotData as Prisma.PickupSlotCreateInput })
        summary.slotsCreated++
        slotIdByLabel.set(slot.label, created.id)
      }
    }

    for (const product of data.products) {
      const categoryId = categoryIdByName.get(product.categoryName)
      if (!categoryId) throw new Error(`Unbekannte Kategorie "${product.categoryName}"`)
      const allowedSlotIds = (product.slotLabels ?? []).map((label) => {
        const slotId = slotIdByLabel.get(label)
        if (!slotId) throw new Error(`Unbekannter Zeitslot "${label}"`)
        return slotId
      })

      const existing = await tx.product.findFirst({ where: { name: product.name, categoryId } })
      const baseData = {
        name: product.name,
        description: product.description ?? null,
        price: product.price,
        categoryId,
        available: product.available ?? true,
        maxQuantity: product.maxQuantity ?? null,
        stock: product.stock ?? null,
        imageUrl: product.imageUrl ?? null,
      }
      if (existing) {
        await tx.product.update({
          where: { id: existing.id },
          data: { ...baseData, allowedSlots: { set: allowedSlotIds.map((id) => ({ id })) } },
        })
        summary.productsUpdated++
      } else {
        await tx.product.create({
          data: { ...baseData, allowedSlots: { connect: allowedSlotIds.map((id) => ({ id })) } },
        })
        summary.productsCreated++
      }
    }

    return summary
  })
}
