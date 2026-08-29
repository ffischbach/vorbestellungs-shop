import { getCategories } from '@repo/database'
import { PageHeader } from '@/components/admin/PageHeader'
import { CategoryTable } from './CategoryTable'
import { NewCategoryDialog } from './NewCategoryDialog'

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kategorien"
        description={`${categories.length} Kategorien`}
        actions={<NewCategoryDialog />}
      />

      <CategoryTable
        categories={categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          productCount: cat.products.length,
        }))}
      />
    </div>
  )
}
