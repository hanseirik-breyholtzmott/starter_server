import { Permission } from "../models/users.model";

export type RoleName =
  | "admin"
  | "user"
  | "moderator"
  | "editor"
  | "contributor"
  | "subscriber"
  | "viewer"
  | "customer"
  | "developer"
  | "project manager"
  | "analyst"
  | "support agent"
  | "vendor";

export interface IRole {
  name: RoleName;
  permissions: Permission[];
}

// Define default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  admin: [
    "full_access",
    "manage_users",
    "set_permissions",
    "view_edit_data",
    "access_audit_logs",
    "system_configuration",
    "access_reports",
    "content_management",
  ],
  user: [
    "limited_access",
    "view_personal_data",
    "use_core_features",
    "view_own_submissions",
    "access_premium_content",
    "manage_subscription",
    "receive_notifications",
    "view_account_information",
  ],
  moderator: [
    "moderate_content",
    "user_management",
    "view_reports",
    "create_edit_content",
    "publish_content",
    "manage_contributors",
    "view_content_reports",
  ],
  editor: [
    "create_edit_content",
    "publish_content",
    "manage_contributors",
    "view_content_reports",
    "view_own_submissions",
  ],
  contributor: ["create_edit_content", "view_own_submissions", "collaborate"],
  subscriber: [
    "access_premium_content",
    "view_own_submissions",
    "receive_notifications",
  ],
  viewer: ["view_public_content", "limited_access"],
  customer: [
    "view_personal_data",
    "manage_subscription",
    "view_account_information",
    "receive_notifications",
  ],
  developer: [
    "access_test_environment",
    "report_bugs",
    "view_edit_data",
    "system_configuration",
  ],
  analyst: [
    "access_data_analytics",
    "generate_reports",
    "export_data",
    "view_reports",
  ],
  vendor: [
    "manage_inventory",
    "view_orders",
    "upload_product_data",
    "billing_and_payments",
  ],
  "project manager": [
    "manage_projects",
    "assign_tasks",
    "view_project_status",
    "collaborate",
    "access_reports",
  ],
  "support agent": [
    "access_support_dashboard",
    "respond_to_queries",
    "view_customer_information",
  ],
};

export interface AuthUserResponse {
  _id: string;
  user_id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  roles: IRole[];
  permissions: Permission[];
}

export interface CreateUserResponse {
  user: AuthUserResponse;
  accessToken: string;
  refreshToken: string;
}

// Helper function to get default permissions for a role
export const getDefaultPermissions = (roleName: RoleName): Permission[] => {
  return DEFAULT_ROLE_PERMISSIONS[roleName] || [];
};

// Helper function to create a role with default permissions
export const createRole = (roleName: RoleName): IRole => {
  return {
    name: roleName,
    permissions: getDefaultPermissions(roleName),
  };
};

// Helper function to check if a user has a specific permission
export const hasPermission = (
  user: AuthUserResponse,
  permission: Permission
): boolean => {
  return user.permissions.includes(permission);
};

// Helper function to check if a user has a specific role
export const hasRole = (
  user: AuthUserResponse,
  roleName: RoleName
): boolean => {
  return user.roles.some((role) => role.name === roleName);
};

// Helper function to check if a user has any of the specified roles
export const hasAnyRole = (
  user: AuthUserResponse,
  roleNames: RoleName[]
): boolean => {
  return user.roles.some((role) => roleNames.includes(role.name));
};

// Helper function to check if a user has all specified permissions
export const hasAllPermissions = (
  user: AuthUserResponse,
  permissions: Permission[]
): boolean => {
  return permissions.every((permission) =>
    user.permissions.includes(permission)
  );
};
