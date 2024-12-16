import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { UNAUTHORIZED, FORBIDDEN } from "../utils/contants";
import userService from "../service/user.service";
import { Permission, IRole } from "../models/users.model";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      permissions?: Permission[];
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(UNAUTHORIZED).json({
        status: UNAUTHORIZED,
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const { payload } = verifyToken(token);

    if (!payload?.userId) {
      return res.status(UNAUTHORIZED).json({
        status: UNAUTHORIZED,
        success: false,
        message: "Invalid token",
      });
    }

    // Get user and attach to request
    const user = await userService.getUserById(payload.userId);
    if (!user) {
      return res.status(UNAUTHORIZED).json({
        status: UNAUTHORIZED,
        success: false,
        message: "User not found",
      });
    }

    // Attach user and their permissions to the request
    req.user = user;
    req.permissions = user.roles.flatMap((role) => role.permissions);

    next();
  } catch (error) {
    return res.status(UNAUTHORIZED).json({
      status: UNAUTHORIZED,
      success: false,
      message: "Invalid token",
    });
  }
};

export const requirePermissions = (requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.permissions) {
      return res.status(UNAUTHORIZED).json({
        status: UNAUTHORIZED,
        success: false,
        message: "Authentication required",
      });
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      req.permissions?.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(FORBIDDEN).json({
        status: FORBIDDEN,
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.roles) {
      return res.status(UNAUTHORIZED).json({
        status: UNAUTHORIZED,
        success: false,
        message: "Authentication required",
      });
    }

    const hasAllowedRole = req.user.roles.some((role: IRole) =>
      allowedRoles.includes(role.name)
    );

    if (!hasAllowedRole) {
      return res.status(FORBIDDEN).json({
        status: FORBIDDEN,
        success: false,
        message: "Insufficient role permissions",
      });
    }

    next();
  };
};
