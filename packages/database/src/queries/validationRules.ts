import { db } from '../index'
import type { ValidationRule } from '@repo/config'

export interface ValidationRuleRecord {
  id: string
  enabled: boolean
  rule: ValidationRule
  createdAt: Date
}

export async function getValidationRules(): Promise<ValidationRuleRecord[]> {
  const rows = await db.validationRule.findMany({ orderBy: { createdAt: 'asc' } })
  return rows.map((row) => ({
    id: row.id,
    enabled: row.enabled,
    rule: row.rule as ValidationRule,
    createdAt: row.createdAt,
  }))
}

export async function getEnabledValidationRules(): Promise<ValidationRule[]> {
  const rows = await db.validationRule.findMany({ where: { enabled: true } })
  return rows.map((row) => row.rule as ValidationRule)
}

export async function createValidationRule(rule: ValidationRule) {
  return db.validationRule.create({ data: { rule } })
}

export async function setValidationRuleEnabled(id: string, enabled: boolean) {
  return db.validationRule.update({ where: { id }, data: { enabled } })
}

export async function deleteValidationRule(id: string) {
  return db.validationRule.delete({ where: { id } })
}
