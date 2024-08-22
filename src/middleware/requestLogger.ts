import { Request, Response, NextFunction } from 'express';
import morgan, { StreamOptions } from 'morgan';
import winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

// Logger setup
const { combine, timestamp, json, errors } = winston.format;
const betterstackToken = process.env.BETTERSTACK_TOKEN;
const logtail = new Logtail(betterstackToken);

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    errors({ stack: true }),
    timestamp(),
    json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'requests.log' }),
    new LogtailTransport(logtail)
  ],
  defaultMeta: { service: 'HTTPService' }
});

// Custom morgan token to log response time
morgan.token('response-time-ms', function (req, res) {
  return `${res.getHeader('X-Response-Time')}ms`;
});

// Middleware to measure response time
const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startHrTime = process.hrtime();
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startHrTime);
    const elapsedTimeInMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(3);
    res.setHeader('X-Response-Time', elapsedTimeInMs);

    // Log request details using Winston
    logger.info(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${elapsedTimeInMs}ms`
    });
  });
  next();
};

// Morgan middleware setup
const morganMiddleware = morgan(':method :url :status :response-time-ms', {
  stream: { write: (message) => logger.info(message.trim()) } as StreamOptions
});

export { responseTimeMiddleware, morganMiddleware };
