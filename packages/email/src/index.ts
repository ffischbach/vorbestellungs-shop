import { render } from '@react-email/render'
import { OrderConfirmation, type OrderConfirmationProps } from './templates/order-confirmation'
import { OrderReminder, type OrderReminderProps } from './templates/order-reminder'

export { OrderConfirmation, type OrderConfirmationProps }
export { OrderReminder, type OrderReminderProps }

export async function renderEmail(
  template: 'order-confirmation',
  props: OrderConfirmationProps
): Promise<string>
export async function renderEmail(
  template: 'order-reminder',
  props: OrderReminderProps
): Promise<string>
export async function renderEmail(
  template: 'order-confirmation' | 'order-reminder',
  props: OrderConfirmationProps | OrderReminderProps
): Promise<string> {
  switch (template) {
    case 'order-confirmation':
      return render(OrderConfirmation(props as OrderConfirmationProps))
    case 'order-reminder':
      return render(OrderReminder(props as OrderReminderProps))
  }
}
