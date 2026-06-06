import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from 'react-email'

export type OrderConfirmationProps = {
  orderNumber: string
  customerName: string
  items: Array<{ name: string; quantity: number; price: number }>
  pickupSlot: { label: string; startTime: string; endTime: string }
  clubName: string
  contactEmail: string
  qrCodeUrl?: string
}

export function OrderConfirmation({
  orderNumber,
  customerName,
  items,
  pickupSlot,
  clubName,
  contactEmail,
  qrCodeUrl,
}: OrderConfirmationProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <Html lang="de">
      <Head />
      <Preview>
        Deine Bestellung #{orderNumber} bei {clubName} ist eingegangen
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={clubLabel}>{clubName}</Text>
          <Heading as="h1" style={h1}>
            Bestellbestätigung
          </Heading>

          <Text style={text}>Hallo {customerName},</Text>
          <Text style={text}>
            vielen Dank für deine Bestellung! Wir haben sie erhalten und freuen uns auf dich.
          </Text>

          <Section style={infoBox}>
            <Text style={infoLabel}>Bestellnummer</Text>
            <Text style={infoValue}>#{orderNumber}</Text>
          </Section>

          <Heading as="h2" style={h2}>
            Deine Bestellung
          </Heading>

          {items.map((item, i) => (
            <Row key={i} style={itemRow}>
              <Column>
                <Text style={itemName}>
                  {item.quantity}× {item.name}
                </Text>
              </Column>
              <Column style={{ width: '100px', textAlign: 'right' }}>
                <Text style={itemPrice}>{(item.price * item.quantity).toFixed(2)} €</Text>
              </Column>
            </Row>
          ))}

          <Hr style={hr} />

          <Row style={itemRow}>
            <Column>
              <Text style={totalLabel}>Gesamt</Text>
            </Column>
            <Column style={{ width: '100px', textAlign: 'right' }}>
              <Text style={totalPrice}>{total.toFixed(2)} €</Text>
            </Column>
          </Row>

          <Heading as="h2" style={h2}>
            Abholung
          </Heading>
          <Section style={infoBox}>
            <Text style={infoLabel}>Zeitslot</Text>
            <Text style={infoValue}>{pickupSlot.label}</Text>
          </Section>

          {qrCodeUrl && (
            <Section style={qrSection}>
              <Text style={qrLabel}>QR-Code für die Abholung</Text>
              <Img
                src={qrCodeUrl}
                width={140}
                height={140}
                alt={`QR-Code Bestellung #${orderNumber}`}
              />
              <Text style={qrHint}>Zeige diesen Code beim Abholen vor — kein Ausdrucken nötig.</Text>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Bei Fragen erreichst du uns unter{' '}
            <Link href={`mailto:${contactEmail}`} style={footerLink}>
              {contactEmail}
            </Link>
            . Wir freuen uns auf deinen Besuch!
          </Text>
          <Text style={footer}>Dein {clubName}-Team</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#f6f6f6', fontFamily: 'sans-serif' }
const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  padding: '24px',
  borderRadius: '8px',
}
const clubLabel = { fontSize: '13px', color: '#6b7280', margin: '0 0 4px', fontWeight: 'bold' as const }
const h1 = { fontSize: '22px', color: '#111827', margin: '0 0 24px' }
const h2 = { fontSize: '16px', color: '#111827', margin: '24px 0 8px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6' }
const infoBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '8px 0',
}
const infoLabel = { fontSize: '12px', color: '#6b7280', margin: '0 0 2px' }
const infoValue = { fontSize: '15px', color: '#111827', margin: '0', fontWeight: 'bold' as const }
const itemRow = { padding: '5px 0' }
const itemName = { fontSize: '14px', color: '#374151', margin: '0' }
const itemPrice = { fontSize: '14px', color: '#374151', margin: '0' }
const totalLabel = { fontSize: '14px', color: '#111827', margin: '0', fontWeight: 'bold' as const }
const totalPrice = { fontSize: '14px', color: '#111827', margin: '0', fontWeight: 'bold' as const }
const hr = { borderColor: '#e5e7eb', margin: '12px 0' }
const qrSection = { margin: '20px 0', textAlign: 'center' as const }
const qrLabel = { fontSize: '13px', color: '#6b7280', margin: '0 0 10px', fontWeight: 'bold' as const }
const qrHint = { fontSize: '12px', color: '#9ca3af', margin: '8px 0 0' }
const footer = { fontSize: '13px', color: '#6b7280', marginTop: '24px' }
const footerLink = { color: '#6b7280' }
