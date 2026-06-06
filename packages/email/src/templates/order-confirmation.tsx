import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
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
}

export function OrderConfirmation({
  orderNumber,
  customerName,
  items,
  pickupSlot,
  clubName,
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
          <Heading style={h1}>{clubName}</Heading>
          <Heading as="h2" style={h2}>
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

          <Heading as="h3" style={h3}>
            Deine Bestellung
          </Heading>

          {items.map((item, i) => (
            <Row key={i} style={itemRow}>
              <Text style={itemName}>
                {item.quantity}× {item.name}
              </Text>
              <Text style={itemPrice}>{(item.price * item.quantity).toFixed(2)} €</Text>
            </Row>
          ))}

          <Hr style={hr} />

          <Row style={itemRow}>
            <Text style={{ ...itemName, fontWeight: 'bold' }}>Gesamt</Text>
            <Text style={{ ...itemPrice, fontWeight: 'bold' }}>{total.toFixed(2)} €</Text>
          </Row>

          <Heading as="h3" style={h3}>
            Abholung
          </Heading>
          <Section style={infoBox}>
            <Text style={infoLabel}>Zeitslot</Text>
            <Text style={infoValue}>{pickupSlot.label}</Text>
          </Section>

          <Text style={footer}>
            Bei Fragen erreichst du uns per E-Mail. Wir freuen uns auf deinen Besuch!
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
const h1 = { fontSize: '24px', color: '#1a56db', margin: '0 0 8px' }
const h2 = { fontSize: '20px', color: '#111827', margin: '0 0 24px' }
const h3 = { fontSize: '16px', color: '#111827', margin: '24px 0 8px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6' }
const infoBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '8px 0',
}
const infoLabel = { fontSize: '12px', color: '#6b7280', margin: '0 0 2px' }
const infoValue = { fontSize: '15px', color: '#111827', margin: '0', fontWeight: 'bold' as const }
const itemRow = { display: 'flex', justifyContent: 'space-between', padding: '4px 0' }
const itemName = { fontSize: '14px', color: '#374151', margin: '0' }
const itemPrice = { fontSize: '14px', color: '#374151', margin: '0', textAlign: 'right' as const }
const hr = { borderColor: '#e5e7eb', margin: '12px 0' }
const footer = { fontSize: '13px', color: '#6b7280', marginTop: '24px' }
