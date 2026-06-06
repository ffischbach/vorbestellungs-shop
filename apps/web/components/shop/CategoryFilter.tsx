'use client'



interface Category {
  id: string
  name: string
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategoryId?: string
  onSelectCategory: (categoryId: string | undefined) => void
}



export function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
      <button
        onClick={() => onSelectCategory(undefined)}
        className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-colors border-b-2 ${
          selectedCategoryId === undefined
            ? 'border-foreground text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        Alle
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-colors border-b-2 ${
            selectedCategoryId === category.id
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
