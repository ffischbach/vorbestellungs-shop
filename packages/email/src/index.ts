import { render } from '@react-email/render'
import { OrderConfirmation, type OrderConfirmationProps } from './templates/order-confirmation'
import { OrderReminder, type OrderReminderProps } from './templates/order-reminder'
import { OrderCancellation, type OrderCancellationProps } from './templates/order-cancellation'

export { OrderConfirmation, type OrderConfirmationProps }
export { OrderReminder, type OrderReminderProps }
export { OrderCancellation, type OrderCancellationProps }

export async function renderEmail(
  template: 'order-confirmation',
  props: OrderConfirmationProps
): Promise<string>
export async function renderEmail(
  template: 'order-reminder',
  props: OrderReminderProps
): Promise<string>
export async function renderEmail(
  template: 'order-cancellation',
  props: OrderCancellationProps
): Promise<string>
export async function renderEmail(
  template: 'order-confirmation' | 'order-reminder' | 'order-cancellation',
  props: OrderConfirmationProps | OrderReminderProps | OrderCancellationProps
): Promise<string> {
  switch (template) {
    case 'order-confirmation':
      return render(OrderConfirmation(props as OrderConfirmationProps))
    case 'order-reminder':
      return render(OrderReminder(props as OrderReminderProps))
    case 'order-cancellation':
      return render(OrderCancellation(props as OrderCancellationProps))
  }
}
