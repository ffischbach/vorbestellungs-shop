import { describe, expect, it } from 'vitest'
import { zonedDateTimeLocalToUtc, utcToZonedDateTimeLocal, formatInTimeZone } from '@repo/config'

describe('zonedDateTimeLocalToUtc', () => {
  it('converts a winter (CET, UTC+1) wall-clock time to UTC', () => {
    const result = zonedDateTimeLocalToUtc('2027-03-26T11:00', 'Europe/Berlin')
    expect(result.toISOString()).toBe('2027-03-26T10:00:00.000Z')
  })

  it('converts a summer (CEST, UTC+2) wall-clock time to UTC', () => {
    const result = zonedDateTimeLocalToUtc('2027-07-19T11:00', 'Europe/Berlin')
    expect(result.toISOString()).toBe('2027-07-19T09:00:00.000Z')
  })

  it('returns an Invalid Date for malformed input instead of throwing', () => {
    const result = zonedDateTimeLocalToUtc('not-a-date', 'Europe/Berlin')
    expect(isNaN(result.getTime())).toBe(true)
  })
})

describe('utcToZonedDateTimeLocal', () => {
  it('is the inverse of zonedDateTimeLocalToUtc across a DST boundary', () => {
    const utc = zonedDateTimeLocalToUtc('2027-07-19T11:00', 'Europe/Berlin')
    expect(utcToZonedDateTimeLocal(utc, 'Europe/Berlin')).toBe('2027-07-19T11:00')
  })
})

describe('formatInTimeZone', () => {
  it('formats a UTC instant using the wall-clock time of the given zone', () => {
    const utc = new Date('2027-03-26T10:00:00.000Z')
    expect(formatInTimeZone(utc, 'Europe/Berlin', { hour: '2-digit', minute: '2-digit' })).toBe('11:00')
  })
})
