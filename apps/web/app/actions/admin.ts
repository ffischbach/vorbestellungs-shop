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
  getProductById,
  updateOrderStatus,
  upsertClubConfig,
  importShopData,
  previewShopImport,
  resetShopData,
  createValidationRule,
  setValidationRuleEnabled,
  deleteValidationRule,
  type ShopImportSummary,
  type ShopImportPreview,
  type ShopResetSummary,
} from '@repo/database'
import { shopImportSchema, validationRuleSchema } from '@repo/config'
import { deleteFile } from '@/lib/storage'
import { SHOP_RESET_CONFIRMATION_PHRASE } from '@/lib/shopReset'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export type ActionState = { error: string } | { success: true } | null

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

// =============================================================================
// Kategorien
// =============================================================================

export async function createCategoryAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()
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
  await requireAdmin()
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

export async function deleteCategoryAction(formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = formData.get('id')?.toString()
  if (!id) return { error: 'Ungültige Eingabe.' }
  try {
    await deleteCategory(id)
  } catch {
    return { error: 'Kategorie kann nicht gelöscht werden — es existieren noch Produkte in dieser Kategorie.' }
  }
  revalidatePath('/admin/categories')
  return { success: true }
}

// =============================================================================
// Zeitslots
// =============================================================================

export async function createSlotAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()
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
  await requireAdmin()
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

export async function deleteSlotAction(formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = formData.get('id')?.toString()
  if (!id) return { error: 'Ungültige Eingabe.' }
  try {
    await deletePickupSlot(id)
  } catch {
    return { error: 'Zeitslot kann nicht gelöscht werden — es existieren bereits Bestellungen für diesen Slot.' }
  }
  revalidatePath('/admin/slots')
  return { success: true }
}

// =============================================================================
// Produkte
// =============================================================================

export async function createProductAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()
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

  const stockRaw = formData.get('stock')?.toString().trim()
  const stock = stockRaw ? parseInt(stockRaw, 10) : undefined
  if (stock !== undefined && (isNaN(stock) || stock < 1)) {
    return { error: 'Bestand muss eine positive Zahl sein.' }
  }

  try {
    await createProduct({ name, description, price, categoryId, allowedSlotIds, maxQuantity, stock, imageUrl })
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
  await requireAdmin()
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

  const stockRaw = formData.get('stock')?.toString().trim()
  const stock = stockRaw ? parseInt(stockRaw, 10) : null
  if (stock !== null && (isNaN(stock) || stock < 1)) {
    return { error: 'Bestand muss eine positive Zahl sein.' }
  }

  try {
    await updateProduct(id, { name, description, price, categoryId, allowedSlotIds, maxQuantity, stock, imageUrl })
    revalidatePath('/admin/products')
    return { success: true }
  } catch {
    return { error: 'Produkt konnte nicht aktualisiert werden.' }
  }
}

export async function toggleProductAvailabilityAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = formData.get('id')?.toString()
  const available = formData.get('available') === 'true'
  if (!id) return
  await updateProduct(id, { available: !available })
  revalidatePath('/admin/products')
}

export async function deleteProductAction(formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = formData.get('id')?.toString()
  if (!id) return { error: 'Ungültige Eingabe.' }
  const product = await getProductById(id)
  try {
    await deleteProduct(id)
  } catch {
    return { error: 'Produkt kann nicht gelöscht werden — es existieren bereits Bestellungen für dieses Produkt.' }
  }
  if (product?.imageUrl) {
    try { await deleteFile(product.imageUrl) } catch { /* S3-Fehler soll DB-Erfolg nicht überschreiben */ }
  }
  revalidatePath('/admin/products')
  return { success: true }
}

// =============================================================================
// Vereinseinstellungen
// =============================================================================

export async function updateClubConfigAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()
  const clubName = formData.get('clubName')?.toString().trim()
  const eventName = formData.get('eventName')?.toString().trim()
  const eventDate = formData.get('eventDate')?.toString().trim()
  const contactEmail = formData.get('contactEmail')?.toString().trim()
  const primaryColor = formData.get('primaryColor')?.toString().trim()
  const accentColor = formData.get('accentColor')?.toString().trim()
  const paymentMethods = formData.getAll('paymentMethods')
    .map((v) => v.toString().trim())
    .filter((v) => v.length > 0)

  if (!clubName || !eventName || !eventDate || !contactEmail || !primaryColor || !accentColor) {
    return { error: 'Alle Felder sind Pflicht.' }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return { error: 'Datum muss im Format JJJJ-MM-TT angegeben werden.' }
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor) || !/^#[0-9a-fA-F]{6}$/.test(accentColor)) {
    return { error: 'Farben müssen als Hex-Wert (#rrggbb) angegeben werden.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(contactEmail)) {
    return { error: 'Ungültige E-Mail-Adresse.' }
  }

  if (paymentMethods.length === 0) {
    return { error: 'Mindestens eine Zahlungsart ist Pflicht.' }
  }

  try {
    await upsertClubConfig({ clubName, eventName, eventDate, contactEmail, primaryColor, accentColor, paymentMethods })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { error: 'Einstellungen konnten nicht gespeichert werden.' }
  }
}

// =============================================================================
// Validierungsregeln (ADR-003, BL-002)
// =============================================================================

export async function createValidationRuleAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()
  const type = formData.get('type')?.toString()

  let rawRule: unknown
  switch (type) {
    case 'pickup_slot_match':
      rawRule = { type }
      break
    case 'max_quantity_per_product': {
      const productId = formData.get('productId')?.toString()
      const max = parseInt(formData.get('max')?.toString() ?? '', 10)
      rawRule = { type, productId, max }
      break
    }
    case 'category_requires_slot': {
      const categoryId = formData.get('categoryId')?.toString()
      const allowedSlotIds = formData.getAll('allowedSlotIds').map(String)
      rawRule = { type, categoryId, allowedSlotIds }
      break
    }
    default:
      return { error: 'Ungültiger Regel-Typ.' }
  }

  const result = validationRuleSchema.safeParse(rawRule)
  if (!result.success) return { error: 'Ungültige Regel-Eingabe.' }

  try {
    await createValidationRule(result.data)
    revalidatePath('/admin/rules')
    return { success: true }
  } catch {
    return { error: 'Regel konnte nicht erstellt werden.' }
  }
}

export async function toggleValidationRuleAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = formData.get('id')?.toString()
  const enabled = formData.get('enabled') === 'true'
  if (!id) return
  await setValidationRuleEnabled(id, !enabled)
  revalidatePath('/admin/rules')
}

export async function deleteValidationRuleAction(formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = formData.get('id')?.toString()
  if (!id) return { error: 'Ungültige Eingabe.' }
  try {
    await deleteValidationRule(id)
  } catch {
    return { error: 'Regel konnte nicht gelöscht werden.' }
  }
  revalidatePath('/admin/rules')
  return { success: true }
}

// =============================================================================
// Setup-Import
// =============================================================================

export type ShopImportActionResult =
  | { success: false; error: string }
  | { success: true; preview: ShopImportPreview }
  | { success: true; summary: ShopImportSummary }

export async function importShopDataAction(
  rawJson: string,
  dryRun: boolean,
): Promise<ShopImportActionResult> {
  await requireAdmin()

  let parsed: unknown
  try {
    parsed = JSON.parse(rawJson)
  } catch {
    return { success: false, error: 'Ungültiges JSON.' }
  }

  const result = shopImportSchema.safeParse(parsed)
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    return { success: false, error: message }
  }

  if (dryRun) {
    const preview = await previewShopImport(result.data)
    return { success: true, preview }
  }

  try {
    const summary = await importShopData(result.data)
    revalidatePath('/admin/categories')
    revalidatePath('/admin/slots')
    revalidatePath('/admin/products')
    return { success: true, summary }
  } catch {
    return { success: false, error: 'Import fehlgeschlagen — es wurde nichts gespeichert.' }
  }
}

export type ShopResetActionResult =
  | { success: false; error: string }
  | { success: true; summary: ShopResetSummary }

export async function resetShopDataAction(confirmation: string): Promise<ShopResetActionResult> {
  await requireAdmin()

  if (confirmation !== SHOP_RESET_CONFIRMATION_PHRASE) {
    return { success: false, error: 'Bestätigungstext stimmt nicht überein.' }
  }

  try {
    const summary = await resetShopData()
    for (const imageUrl of summary.productImageUrls) {
      try { await deleteFile(imageUrl) } catch { /* S3-Fehler soll DB-Erfolg nicht überschreiben */ }
    }
    revalidatePath('/admin/categories')
    revalidatePath('/admin/slots')
    revalidatePath('/admin/products')
    revalidatePath('/admin/orders')
    return { success: true, summary }
  } catch {
    return { success: false, error: 'Zurücksetzen fehlgeschlagen — es wurde nichts gelöscht.' }
  }
}

// =============================================================================
// Bestellungen
// =============================================================================

export async function updateOrderStatusAction(formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = formData.get('id')?.toString()
  const status = formData.get('status')?.toString()
  if (!id || !status) return { error: 'Ungültige Eingabe.' }
  if (!['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) return { error: 'Ungültiger Status.' }
  try {
    await updateOrderStatus(id, status as 'PENDING' | 'CONFIRMED' | 'CANCELLED')
  } catch {
    return { error: 'Status konnte nicht aktualisiert werden.' }
  }
  revalidatePath('/admin/orders')
  return { success: true }
}
