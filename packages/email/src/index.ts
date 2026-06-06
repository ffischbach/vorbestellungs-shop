import { render } from '@react-email/render'
import QRCode from 'qrcode'
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
    case 'order-confirmation': {
      const confirmProps = props as OrderConfirmationProps
      const qrCodeDataUrl = await QRCode.toDataURL(confirmProps.orderNumber, {
        width: 140,
        margin: 1,
        color: { dark: '#111827', light: '#ffffff' },
      })
      return render(OrderConfirmation({ ...confirmProps, qrCodeDataUrl }))
    }
    case 'order-reminder':
      return render(OrderReminder(props as OrderReminderProps))
  }
}
