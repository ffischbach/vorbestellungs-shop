import pino from 'pino'

const logger = pino(
  process.env.NODE_ENV === 'production'
    ? { level: 'info' }
    : {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
)

export default logger

export function withContext(context: Record<string, unknown>) {
  return logger.child(context)
}
