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

export type OrderReminderProps = {
  customerName: string
  items: Array<{ name: string; quantity: number }>
  pickupSlot: { label: string }
  clubName: string
  eventDate: string
}

export function OrderReminder({
  customerName,
  items,
  pickupSlot,
  clubName,
  eventDate,
}: OrderReminderProps) {
  return (
    <Html lang="de">
      <Head />
      <Preview>
        Erinnerung: Deine Abholung bei {clubName} morgen — {pickupSlot.label}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{clubName}</Heading>
          <Heading as="h2" style={h2}>
            Erinnerung: Morgen ist es soweit!
          </Heading>

          <Text style={text}>Hallo {customerName},</Text>
          <Text style={text}>
            wir erinnern dich daran, dass du morgen ({eventDate}) deine Bestellung bei uns abholen
            kannst.
          </Text>

          <Section style={infoBox}>
            <Text style={infoLabel}>Dein Abholzeitslot</Text>
            <Text style={infoValue}>{pickupSlot.label}</Text>
          </Section>

          <Heading as="h3" style={h3}>
            Deine Bestellung
          </Heading>

          {items.map((item, i) => (
            <Row key={i} style={itemRow}>
              <Text style={itemName}>
                {item.quantity}× {item.name}
              </Text>
            </Row>
          ))}

          <Hr style={hr} />

          <Text style={text}>Wir freuen uns auf deinen Besuch!</Text>
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
const hr = { borderColor: '#e5e7eb', margin: '12px 0' }
const footer = { fontSize: '13px', color: '#6b7280', marginTop: '24px' }
