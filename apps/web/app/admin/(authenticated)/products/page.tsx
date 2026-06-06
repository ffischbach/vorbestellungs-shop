import { getProducts, getCategories, getPickupSlots } from '@repo/database'
import { deleteProductAction } from '@/app/actions/admin'
import { CreateProductForm } from './ProductForm'
import { ProductRow } from './ProductRow'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [products, categories, slots] = await Promise.all([
    getProducts(),
    getCategories(),
    getPickupSlots(),
  ])
  const { error } = await searchParams

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }))
  const slotOptions = slots.map((s) => ({ id: s.id, label: s.label }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Produkte</h1>
        <p className="text-muted-foreground text-sm mt-1">{products.length} Produkte</p>
      </div>

      {error === 'hat_bestellungen' && (
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/5 px-4 py-2">
          Produkt kann nicht gelöscht werden — es existieren bereits Bestellungen mit diesem Produkt.
        </p>
      )}

      <div className="border border-border">
        {products.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">Noch keine Produkte angelegt.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Kategorie</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Preis</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
                <th className="py-2 px-4 w-44" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  categoryName={product.category.name}
                  price={product.price.toString()}
                  available={product.available}
                  allowedSlotIds={product.allowedSlots.map((s) => s.id)}
                  description={product.description ?? ''}
                  imageUrl={product.imageUrl ?? ''}
                  maxQuantity={product.maxQuantity?.toString() ?? ''}
                  categories={categoryOptions}
                  slots={slotOptions}
                  deleteAction={deleteProductAction}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border border-border p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Neues Produkt</h2>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Lege zuerst mindestens eine Kategorie an.</p>
        ) : (
          <CreateProductForm categories={categoryOptions} slots={slotOptions} />
        )}
      </div>
    </div>
  )
}
