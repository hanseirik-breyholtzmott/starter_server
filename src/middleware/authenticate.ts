import { Request, Response, NextFunction, RequestHandler } from "express";
import { UNAUTHORIZED } from "../utils/contants";
import { verifyToken } from "../utils/jwt";

//Logger
import { userLogger } from "../logger";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  sessionId?: string;
}

const authenticate: RequestHandler = async (req, res, next) => {
  // Retrieve token from cookies or Authorization header
  const accessToken = req.cookies.accessToken || getTokenFromHeader(req);

  console.log("accessToken", accessToken);

  if (!accessToken) {
    userLogger.warn("No access token provided", { ip: req.ip });
    return res.status(UNAUTHORIZED).json({ message: "Unauthorized" });
  }

  // Verify the token
  const { error, payload } = verifyToken(accessToken);

  if (error) {
    const errorMessage =
      error === "jwt expired" ? "Token expired" : "Invalid token";
    userLogger.warn("Token verification failed", {
      error: errorMessage,
      ip: req.ip,
    });
    return res.status(UNAUTHORIZED).json({ message: errorMessage });
  }

  // Optionally check if session is valid
  if (
    payload.sessionId &&
    !(await isSessionValid(payload.sessionId as string))
  ) {
    userLogger.warn("Invalid session", {
      sessionId: payload.sessionId,
      userId: payload.userId,
    });
    return res.status(UNAUTHORIZED).json({ message: "Invalid session" });
  }

  // Attach user information to the request object
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.userId = payload.userId as string;
  authenticatedReq.sessionId = payload.sessionId as string;

  next();
};

const getTokenFromHeader = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1]; // Return the token part after "Bearer"
  }
  return undefined;
};

// Placeholder for session validation logic
const isSessionValid = async (sessionId: string): Promise<boolean> => {
  // Example: Check if the session is active in your session store or database
  // return sessionService.isSessionActive(sessionId);
  return true; // Stub: assume session is valid for now
};

export default authenticate;
