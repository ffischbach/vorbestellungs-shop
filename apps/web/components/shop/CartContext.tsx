'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react'
import { syncCartReservation, clearAllCartReservations, fetchCartItems } from '@/app/actions/cart'

export interface CartItem {
  id: string
  productId: string
  name: string
  variantName?: string
  price: number
  quantity: number
  imageUrl?: string
  allowedSlotIds: string[]
}

export interface CartItemData {
  productId: string
  name: string
  price: number
  imageUrl?: string
  variantName?: string
  allowedSlotIds: string[]
}

interface CartContextType {
  items: CartItem[]
  sessionId: string
  isLoading: boolean
  setProductQuantity: (product: CartItemData, quantity: number) => void
  updateQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  totalItems: number
  totalAmount: number
  selectedSlotId: string | undefined
  setSelectedSlotId: (id: string | undefined) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  const stored = localStorage.getItem('cart_session_id')
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem('cart_session_id', id)
  return id
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(() => typeof window !== 'undefined')
  const [selectedSlotId, setSelectedSlotIdState] = useState<string | undefined>(() =>
    typeof window !== 'undefined' ? readCookie('cart_slot') : undefined
  )
  const [sessionId] = useState(() => typeof window !== 'undefined' ? getOrCreateSessionId() : '')

  const sessionIdRef = useRef(sessionId)
  const itemsRef = useRef<CartItem[]>([])

  useEffect(() => { itemsRef.current = items }, [items])
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])

  useEffect(() => {
    if (!sessionId) {
      return
    }
    document.cookie = `cart_session=${sessionId}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`

    fetchCartItems(sessionId).then((result) => {
      if (result.success) {
        setItems(
          result.data.map((item) => ({
            ...item,
            id: `${item.productId}-${Date.now()}`,
          }))
        )
      }
      setIsLoading(false)
    })
  }, [sessionId])

  const setSelectedSlotId = useCallback((id: string | undefined) => {
    setSelectedSlotIdState(id)
    if (id) {
      document.cookie = `cart_slot=${encodeURIComponent(id)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
    } else {
      document.cookie = 'cart_slot=; path=/; max-age=0'
    }
  }, [])

  const setProductQuantity = useCallback((product: CartItemData, quantity: number) => {
    const sid = sessionIdRef.current
    setItems((curr) => {
      const match = (i: CartItem) =>
        i.productId === product.productId && i.variantName === product.variantName
      if (quantity <= 0) {
        return curr.filter((i) => !match(i))
      }
      const existing = curr.find(match)
      if (existing) {
        return curr.map((i) => (match(i) ? { ...i, quantity } : i))
      }
      return [...curr, { ...product, id: `${Date.now()}-${Math.random()}`, quantity }]
    })
    if (sid) syncCartReservation(sid, product.productId, quantity)
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    const item = itemsRef.current.find((i) => i.id === itemId)
    if (item && sessionIdRef.current) {
      syncCartReservation(sessionIdRef.current, item.productId, Math.max(0, quantity))
    }
    if (quantity <= 0) {
      setItems((curr) => curr.filter((i) => i.id !== itemId))
      return
    }
    setItems((curr) => curr.map((i) => (i.id === itemId ? { ...i, quantity } : i)))
  }, [])

  const removeItem = useCallback((itemId: string) => {
    const item = itemsRef.current.find((i) => i.id === itemId)
    if (item && sessionIdRef.current) {
      syncCartReservation(sessionIdRef.current, item.productId, 0)
    }
    setItems((curr) => curr.filter((i) => i.id !== itemId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setSelectedSlotIdState(undefined)
    document.cookie = 'cart_slot=; path=/; max-age=0'
    if (sessionIdRef.current) clearAllCartReservations(sessionIdRef.current)
  }, [])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        sessionId,
        isLoading,
        setProductQuantity,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        totalAmount,
        selectedSlotId,
        setSelectedSlotId,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
