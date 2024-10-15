import winston from "winston";
const { combine, timestamp, json, prettyPrint, errors } = winston.format;
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import fs from "fs";
import path from "path";

const betterstackToken = process.env.BETTERSTACK_TOKEN;

if (!betterstackToken) {
  throw new Error(
    "BETTERSTACK_TOKEN is not defined in the environment variables"
  );
}

const logtail = new Logtail(betterstackToken);

const logsDirectory =
  process.env.NODE_ENV === "production"
    ? "/tmp/logs"
    : path.join(__dirname, "logs");

// Ensure the logs directory exists
if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory, { recursive: true });
}

//User Logger
winston.loggers.add("UserLogger", {
  level: "info",
  format: combine(
    errors({
      stack: true,
    }),
    timestamp(),
    json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logsDirectory, "users.log"),
      level: "info",
    }),
    new LogtailTransport(logtail),
  ],
  defaultMeta: { service: "UserService" },
});

//Database Logger
winston.loggers.add("DBLogger", {
  level: "info", // Adjust level as necessary
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logsDirectory, "db.log"),
      level: "error",
    }),
    new LogtailTransport(logtail),
  ],
  defaultMeta: { service: "DatabaseService" },
});

//Middleware Logger
winston.loggers.add("MiddlewareLogger", {
  level: "info", // Adjust level as necessary
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logsDirectory, "middleware.log"),
      level: "error",
    }),
    new LogtailTransport(logtail),
  ],
  defaultMeta: { service: "MiddlewareService" },
});

//Campaign Logger
winston.loggers.add("CampaignLogger", {
  level: "info",
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logsDirectory, "campaign.log"),
      level: "info",
    }),
    new LogtailTransport(logtail),
  ],
  defaultMeta: { service: "CampaignService" },
});

//Email Logger
winston.loggers.add("EmailLogger", {
  level: "info",
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logsDirectory, "email.log"),
      level: "info",
    }),
    new LogtailTransport(logtail),
  ],
  defaultMeta: { service: "EmailService" },
});

//Session Logger
winston.loggers.add("SessionLogger", {
  level: "info",
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logsDirectory, "session.log"),
      level: "info",
    }),
    new LogtailTransport(logtail),
  ],
  defaultMeta: { service: "SessionService" },
});

winston.loggers.add("VippsLogger", {
  level: "info",
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logsDirectory, "vipps.log"),
      level: "info",
    }),
    new LogtailTransport(logtail),
  ],
  defaultMeta: { service: "VippsService" },
});

const middlewareLogger = winston.loggers.get("MiddlewareLogger");
const userLogger = winston.loggers.get("UserLogger");
const dbLogger = winston.loggers.get("DBLogger");
const campaignLogger = winston.loggers.get("CampaignLogger");
const emailLogger = winston.loggers.get("EmailLogger");
const sessionLogger = winston.loggers.get("SessionLogger");
const vippsLogger = winston.loggers.get("VippsLogger");

export {
  userLogger,
  dbLogger,
  middlewareLogger,
  campaignLogger,
  emailLogger,
  sessionLogger,
  vippsLogger,
};
