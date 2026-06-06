import { getCategories } from '@repo/database'
import { deleteCategoryAction } from '@/app/actions/admin'
import { CreateCategoryForm } from './CategoryForm'
import { CategoryRow } from './CategoryRow'

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const categories = await getCategories()
  const { error } = await searchParams

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kategorien</h1>
        <p className="text-muted-foreground text-sm mt-1">{categories.length} Kategorien</p>
      </div>

      {error === 'hat_produkte' && (
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/5 px-4 py-2">
          Kategorie kann nicht gelöscht werden — zuerst alle Produkte entfernen oder verschieben.
        </p>
      )}

      <div className="border border-border">
        {categories.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">Noch keine Kategorien angelegt.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Name</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Produkte</th>
                <th className="py-2 px-4 w-40" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  id={cat.id}
                  name={cat.name}
                  productCount={cat.products.length}
                  deleteAction={deleteCategoryAction}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border border-border p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Neue Kategorie</h2>
        <CreateCategoryForm />
      </div>
    </div>
  )
}
