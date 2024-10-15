import { Types } from "mongoose";
//Models
import sessionModel, { ISessionModel } from "../models/session.model";

//Logger
import { sessionLogger } from "../logger";

const createSession = async (userId: string): Promise<ISessionModel> => {
  try {
    const session = await sessionModel.create({
      userId: new Types.ObjectId(userId),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
    });
    sessionLogger.info("Session created", { userId: userId });
    return session;
  } catch (error) {
    sessionLogger.error("Error creating a session", { userId, error });
    throw new Error("Error creating session.");
  }
};

const getSessionById = async (
  sessionId: string
): Promise<ISessionModel | null> => {
  try {
    const session = await sessionModel.findById(sessionId);
    return session;
  } catch (error) {
    sessionLogger.error("Error getting session by id", { sessionId, error });
    throw new Error("Error getting session by id.");
  }
};

const deleteSessionsByUserId = async (userId: string): Promise<void> => {
  try {
    await sessionModel.deleteMany({ userId: userId });
    sessionLogger.info("Sessions deleted", { userId: userId });
  } catch (error) {
    sessionLogger.error("Error deleting sessions by user id", {
      userId,
      error,
    });
    throw new Error("Error deleting sessions by user id.");
  }
};

const deleteSessionById = async (sessionId: string): Promise<void> => {
  try {
    await sessionModel.findByIdAndDelete(sessionId);
    sessionLogger.info("Session deleted", { sessionId: sessionId });
  } catch (error) {
    sessionLogger.error("Error deleting session by id", { sessionId, error });
    throw new Error("Error deleting session by id.");
  }
};

export default {
  createSession,
  getSessionById,
  deleteSessionsByUserId,
  deleteSessionById,
};
