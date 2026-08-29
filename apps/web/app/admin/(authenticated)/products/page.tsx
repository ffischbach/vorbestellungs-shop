import { getProducts, getCategories, getPickupSlots, getProductSoldQuantities } from '@repo/database'
import { PageHeader } from '@/components/admin/PageHeader'
import { ProductTable } from './ProductTable'
import { NewProductDialog } from './NewProductDialog'

export default async function ProductsPage() {
  const [products, categories, slots, soldQuantities] = await Promise.all([
    getProducts(),
    getCategories(),
    getPickupSlots(),
    getProductSoldQuantities(),
  ])

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }))
  const slotOptions = slots.map((s) => ({ id: s.id, label: s.label }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produkte"
        description={`${products.length} Produkte`}
        actions={<NewProductDialog categories={categoryOptions} slots={slotOptions} />}
      />

      {categories.length === 0 && (
        <p className="text-sm text-muted-foreground">Lege zuerst mindestens eine Kategorie an.</p>
      )}

      <ProductTable
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          categoryId: product.category.id,
          categoryName: product.category.name,
          price: product.price.toString(),
          available: product.available,
          allowedSlotIds: product.allowedSlots.map((s) => s.id),
          description: product.description ?? '',
          imageUrl: product.imageUrl ?? '',
          maxQuantity: product.maxQuantity?.toString() ?? '',
          stock: product.stock?.toString() ?? '',
          soldQuantity: soldQuantities[product.id] ?? 0,
        }))}
        categories={categoryOptions}
        slots={slotOptions}
      />
    </div>
  )
}
