import { z } from 'zod'

const importCategorySchema = z.object({
  name: z.string().min(1),
})

const importSlotSchema = z.object({
  label: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  capacity: z.number().int().positive().optional(),
})

const importProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  categoryName: z.string().min(1),
  slotLabels: z.array(z.string().min(1)).optional(),
  available: z.boolean().optional(),
  maxQuantity: z.number().int().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional(),
})

export const shopImportSchema = z
  .object({
    categories: z.array(importCategorySchema).min(1),
    slots: z.array(importSlotSchema).min(1),
    products: z.array(importProductSchema).min(1),
  })
  .superRefine((data, ctx) => {
    const categoryNames = new Set(data.categories.map((c) => c.name))
    const slotLabels = new Set(data.slots.map((s) => s.label))

    data.products.forEach((product, productIndex) => {
      if (!categoryNames.has(product.categoryName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unbekannte Kategorie "${product.categoryName}" — nicht in "categories" definiert.`,
          path: ['products', productIndex, 'categoryName'],
        })
      }
      product.slotLabels?.forEach((label, slotIndex) => {
        if (!slotLabels.has(label)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unbekannter Zeitslot "${label}" — nicht in "slots" definiert.`,
            path: ['products', productIndex, 'slotLabels', slotIndex],
          })
        }
      })
    })
  })

export type ShopImportData = z.infer<typeof shopImportSchema>
