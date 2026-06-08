import pino from 'pino'
import { getRequestContext } from './request-context'

const base = pino(
  process.env.NODE_ENV === 'production'
    ? {
        level: 'info',
        formatters: {
          level(label) {
            return { level: label }
          },
        },
      }
    : {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
      },
)

type LogObj = Record<string, unknown>

function contextual() {
  const ctx = getRequestContext()
  return ctx ? base.child(ctx) : base
}

function makeLogFn(level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal') {
  return (objOrMsg: LogObj | string, msg?: string) => {
    const l = contextual()
    if (typeof objOrMsg === 'string') {
      l[level](objOrMsg)
    } else {
      l[level](objOrMsg, msg ?? '')
    }
  }
}

const logger = {
  trace: makeLogFn('trace'),
  debug: makeLogFn('debug'),
  info: makeLogFn('info'),
  warn: makeLogFn('warn'),
  error: makeLogFn('error'),
  fatal: makeLogFn('fatal'),
  child: (bindings: Record<string, unknown>) => base.child(bindings),
}

export default logger

export function withContext(context: Record<string, unknown>) {
  return base.child(context)
}
