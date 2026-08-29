import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from 'react-email'

export type OrderCancellationProps = {
  orderNumber: string
  customerName: string
  items: Array<{ name: string; quantity: number }>
  clubName: string
  contactEmail: string
}

export function OrderCancellation({
  orderNumber,
  customerName,
  items,
  clubName,
  contactEmail,
}: OrderCancellationProps) {
  return (
    <Html lang="de">
      <Head />
      <Preview>
        Deine Bestellung #{orderNumber} bei {clubName} wurde storniert
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={clubLabel}>{clubName}</Text>
          <Heading as="h1" style={h1}>
            Bestellung storniert
          </Heading>

          <Text style={text}>Hallo {customerName},</Text>
          <Text style={text}>
            deine Bestellung wurde storniert. Falls du Fragen dazu hast, melde dich gerne bei uns.
          </Text>

          <Section style={infoBox}>
            <Text style={infoLabel}>Bestellnummer</Text>
            <Text style={infoValue}>#{orderNumber}</Text>
          </Section>

          <Heading as="h2" style={h2}>
            Stornierte Artikel
          </Heading>

          {items.map((item, i) => (
            <Row key={i} style={itemRow}>
              <Text style={itemName}>
                {item.quantity}× {item.name}
              </Text>
            </Row>
          ))}

          <Hr style={hr} />

          <Text style={footer}>
            Bei Fragen erreichst du uns unter{' '}
            <Link href={`mailto:${contactEmail}`} style={footerLink}>
              {contactEmail}
            </Link>
            .
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
const itemRow = { padding: '3px 0' }
const itemName = { fontSize: '14px', color: '#374151', margin: '0' }
const hr = { borderColor: '#e5e7eb', margin: '12px 0' }
const footer = { fontSize: '13px', color: '#6b7280', marginTop: '8px' }
const footerLink = { color: '#6b7280' }
