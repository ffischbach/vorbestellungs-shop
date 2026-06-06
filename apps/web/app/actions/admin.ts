'use server'

import {
  createCategory,
  updateCategory,
  deleteCategory,
  createPickupSlot,
  updatePickupSlot,
  deletePickupSlot,
  createProduct,
  updateProduct,
  deleteProduct,
  updateOrderStatus,
} from '@repo/database'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type ActionState = { error: string } | { success: true } | null

// =============================================================================
// Kategorien
// =============================================================================

export async function createCategoryAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get('name')?.toString().trim()
  if (!name) return { error: 'Name ist Pflicht.' }
  try {
    await createCategory({ name })
    revalidatePath('/admin/categories')
    return { success: true }
  } catch {
    return { error: 'Kategorie konnte nicht erstellt werden.' }
  }
}

export async function updateCategoryAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id')?.toString()
  const name = formData.get('name')?.toString().trim()
  if (!id || !name) return { error: 'Ungültige Eingabe.' }
  try {
    await updateCategory(id, { name })
    revalidatePath('/admin/categories')
    return { success: true }
  } catch {
    return { error: 'Kategorie konnte nicht aktualisiert werden.' }
  }
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const id = formData.get('id')?.toString()
  if (!id) return
  try {
    await deleteCategory(id)
  } catch {
    redirect('/admin/categories?error=hat_produkte')
  }
  revalidatePath('/admin/categories')
}

// =============================================================================
// Zeitslots
// =============================================================================

export async function createSlotAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const label = formData.get('label')?.toString().trim()
  const startTimeRaw = formData.get('startTime')?.toString()
  const endTimeRaw = formData.get('endTime')?.toString()
  const capacityRaw = formData.get('capacity')?.toString().trim()

  if (!label || !startTimeRaw || !endTimeRaw) return { error: 'Label, Start- und Endzeit sind Pflicht.' }

  const startTime = new Date(startTimeRaw)
  const endTime = new Date(endTimeRaw)

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return { error: 'Ungültige Zeitangabe.' }
  if (endTime <= startTime) return { error: 'Endzeit muss nach der Startzeit liegen.' }

  const capacity = capacityRaw ? parseInt(capacityRaw, 10) : undefined
  if (capacity !== undefined && (isNaN(capacity) || capacity < 1)) return { error: 'Kapazität muss eine positive Zahl sein.' }

  try {
    await createPickupSlot({ label, startTime, endTime, capacity })
    revalidatePath('/admin/slots')
    return { success: true }
  } catch {
    return { error: 'Zeitslot konnte nicht erstellt werden.' }
  }
}

export async function updateSlotAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id')?.toString()
  const label = formData.get('label')?.toString().trim()
  const startTimeRaw = formData.get('startTime')?.toString()
  const endTimeRaw = formData.get('endTime')?.toString()
  const capacityRaw = formData.get('capacity')?.toString().trim()

  if (!id || !label || !startTimeRaw || !endTimeRaw) return { error: 'Alle Pflichtfelder ausfüllen.' }

  const startTime = new Date(startTimeRaw)
  const endTime = new Date(endTimeRaw)
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return { error: 'Ungültige Zeitangabe.' }
  if (endTime <= startTime) return { error: 'Endzeit muss nach der Startzeit liegen.' }

  const capacity = capacityRaw ? parseInt(capacityRaw, 10) : null
  if (capacity !== null && (isNaN(capacity) || capacity < 1)) return { error: 'Kapazität muss eine positive Zahl sein.' }

  try {
    await updatePickupSlot(id, { label, startTime, endTime, capacity })
    revalidatePath('/admin/slots')
    return { success: true }
  } catch {
    return { error: 'Zeitslot konnte nicht aktualisiert werden.' }
  }
}

export async function deleteSlotAction(formData: FormData): Promise<void> {
  const id = formData.get('id')?.toString()
  if (!id) return
  try {
    await deletePickupSlot(id)
  } catch {
    redirect('/admin/slots?error=hat_bestellungen')
  }
  revalidatePath('/admin/slots')
}

// =============================================================================
// Produkte
// =============================================================================

export async function createProductAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get('name')?.toString().trim()
  const description = formData.get('description')?.toString().trim() || undefined
  const priceRaw = formData.get('price')?.toString()
  const categoryId = formData.get('categoryId')?.toString()
  const maxQuantityRaw = formData.get('maxQuantity')?.toString().trim()
  const imageUrl = formData.get('imageUrl')?.toString().trim() || undefined
  const allowedSlotIds = formData.getAll('allowedSlotIds').map(String)

  if (!name || !priceRaw || !categoryId) return { error: 'Name, Preis und Kategorie sind Pflicht.' }

  const price = parseFloat(priceRaw)
  if (isNaN(price) || price < 0) return { error: 'Ungültiger Preis.' }

  const maxQuantity = maxQuantityRaw ? parseInt(maxQuantityRaw, 10) : undefined
  if (maxQuantity !== undefined && (isNaN(maxQuantity) || maxQuantity < 1)) {
    return { error: 'Maximale Menge muss eine positive Zahl sein.' }
  }

  try {
    await createProduct({ name, description, price, categoryId, allowedSlotIds, maxQuantity, imageUrl })
    revalidatePath('/admin/products')
    return { success: true }
  } catch {
    return { error: 'Produkt konnte nicht erstellt werden.' }
  }
}

export async function updateProductAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id')?.toString()
  const name = formData.get('name')?.toString().trim()
  const description = formData.get('description')?.toString().trim() || undefined
  const priceRaw = formData.get('price')?.toString()
  const categoryId = formData.get('categoryId')?.toString()
  const maxQuantityRaw = formData.get('maxQuantity')?.toString().trim()
  const imageUrl = formData.get('imageUrl')?.toString().trim() || undefined
  const allowedSlotIds = formData.getAll('allowedSlotIds').map(String)

  if (!id || !name || !priceRaw || !categoryId) return { error: 'Alle Pflichtfelder ausfüllen.' }

  const price = parseFloat(priceRaw)
  if (isNaN(price) || price < 0) return { error: 'Ungültiger Preis.' }

  const maxQuantity = maxQuantityRaw ? parseInt(maxQuantityRaw, 10) : undefined
  if (maxQuantity !== undefined && (isNaN(maxQuantity) || maxQuantity < 1)) {
    return { error: 'Maximale Menge muss eine positive Zahl sein.' }
  }

  try {
    await updateProduct(id, { name, description, price, categoryId, allowedSlotIds, maxQuantity, imageUrl })
    revalidatePath('/admin/products')
    return { success: true }
  } catch {
    return { error: 'Produkt konnte nicht aktualisiert werden.' }
  }
}

export async function toggleProductAvailabilityAction(formData: FormData): Promise<void> {
  const id = formData.get('id')?.toString()
  const available = formData.get('available') === 'true'
  if (!id) return
  await updateProduct(id, { available: !available })
  revalidatePath('/admin/products')
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const id = formData.get('id')?.toString()
  if (!id) return
  try {
    await deleteProduct(id)
  } catch {
    redirect('/admin/products?error=hat_bestellungen')
  }
  revalidatePath('/admin/products')
}

// =============================================================================
// Bestellungen
// =============================================================================

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  const id = formData.get('id')?.toString()
  const status = formData.get('status')?.toString()
  if (!id || !status) return
  if (!['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) return
  await updateOrderStatus(id, status as 'PENDING' | 'CONFIRMED' | 'CANCELLED')
  revalidatePath('/admin/orders')
}
