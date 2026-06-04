import { db } from '../index'

export async function getCategories() {
  return db.category.findMany({
    include: { products: true },
    orderBy: { name: 'asc' },
  })
}

export async function getCategoryById(id: string) {
  return db.category.findUnique({
    where: { id },
    include: { products: true },
  })
}

export async function createCategory(data: { name: string }) {
  return db.category.create({ data })
}

export async function updateCategory(id: string, data: { name: string }) {
  return db.category.update({ where: { id }, data })
}

export async function deleteCategory(id: string) {
  return db.category.delete({ where: { id } })
}
