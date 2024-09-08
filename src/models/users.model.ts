import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid"; // Assuming you're using UUIDs for unique IDs

//Define the IAddress interface
export interface IAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  additionalInfo?: string | null;
}

export type Permission =
  | "full_access"
  | "manage_users"
  | "set_permissions"
  | "view_edit_data"
  | "access_audit_logs"
  | "system_configuration"
  | "access_reports"
  | "content_management"
  | "limited_access"
  | "view_personal_data"
  | "use_core_features"
  | "moderate_content"
  | "user_management"
  | "view_reports"
  | "create_edit_content"
  | "publish_content"
  | "manage_contributors"
  | "view_content_reports"
  | "view_own_submissions"
  | "access_premium_content"
  | "manage_subscription"
  | "receive_notifications"
  | "view_account_information"
  | "manage_projects"
  | "assign_tasks"
  | "view_project_status"
  | "collaborate"
  | "access_data_analytics"
  | "generate_reports"
  | "export_data"
  | "access_support_dashboard"
  | "respond_to_queries"
  | "view_customer_information"
  | "manage_inventory"
  | "view_orders"
  | "upload_product_data"
  | "billing_and_payments"
  | "approve_or_reject"
  | "access_test_environment"
  | "report_bugs"
  | "view_public_content";

export interface IRole {
  name: string;
  permissions: Permission[];
}

// Define the IUser interface
export interface IUser {
  user_id: string;
  ssn: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  //username: string | null;
  hasImage: boolean;
  imageUrl: string | null;
  address: IAddress | null;
  primaryEmailAddress: string | null;
  emailAddresses: Array<string>;
  primaryPhoneNumber: string | null;
  phoneNumbers: Array<string>;
  hasVerifiedPhoneNumber: boolean;
  hasVerifiedPrimaryEmailAddress: boolean;
  passwordEnabled: boolean;
  password: string;
  resetPasswordToken: string | null;
  resetPasswordExpiresAt: Date | null;
  verificationToken: string | null;
  verificationTokenExpiresAt: Date | null;
  deleteSelfEnabled: boolean;
  stripeCustomerId: string | null;
  roles: IRole[];
  lastSignInAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Define the IUserModel interface, extending IUser and Document
export interface IUserModel extends IUser, Document {}

//Define the AddressSchema with Mongoose
const AddressSchema = new Schema({
  street: { type: Schema.Types.String, required: false },
  city: { type: Schema.Types.String, required: false },
  state: { type: Schema.Types.String, required: false },
  country: { type: Schema.Types.String, required: false },
  postalCode: { type: Schema.Types.String, required: false },
});

// Define the UsersSchema with Mongoose
const UsersSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.String,
      unique: true,
      default: () => uuidv4(),
    },
    ssn: {
      type: Schema.Types.String,
      unique: true,
      sparse: true,
      default: null,
    },
    firstName: { type: Schema.Types.String, default: null },
    lastName: { type: Schema.Types.String, default: null },
    fullName: { type: Schema.Types.String, default: null },
    //username: { type: Schema.Types.String, unique: true, default: null },
    hasImage: { type: Schema.Types.Boolean, default: false },
    imageUrl: { type: Schema.Types.String, default: null },
    address: { type: AddressSchema, default: null },
    primaryEmailAddress: {
      type: Schema.Types.String,
      required: true,
      unique: true,
      default: null,
    },
    emailAddresses: { type: [Schema.Types.String], default: [] },
    primaryPhoneNumber: { type: Schema.Types.String, default: null },
    phoneNumbers: { type: [Schema.Types.String], default: [] },
    hasVerifiedPhoneNumber: { type: Schema.Types.Boolean, default: false },
    hasVerifiedPrimaryEmailAddress: {
      type: Schema.Types.Boolean,
      default: false,
    },
    passwordEnabled: { type: Schema.Types.Boolean, default: false },
    password: { type: Schema.Types.String, required: true },
    resetPasswordToken: { type: Schema.Types.String, default: null },
    resetPasswordExpiresAt: { type: Schema.Types.Date, default: null },
    verificationTokenExpiresAt: { type: Schema.Types.Date, default: null },
    verificationToken: { type: Schema.Types.String, default: null },
    deleteSelfEnabled: { type: Schema.Types.Boolean, default: false },
    stripeCustomerId: { type: Schema.Types.String, default: null },
    roles: [
      {
        name: {
          type: Schema.Types.String,
          enum: [
            "admin",
            "user",
            "moderator",
            "editor",
            "contributor",
            "subscriber",
            "viewer",
            "customer",
            "developer",
            "project manager",
            "analyst",
            "support agent",
            "vendor",
          ],
          required: true,
          default: "user",
        },
        permissions: [
          {
            type: Schema.Types.String,
            enum: [
              "full_access",
              "manage_users",
              "set_permissions",
              "view_edit_data",
              "access_audit_logs",
              "system_configuration",
              "access_reports",
              "content_management",
              "limited_access",
              "view_personal_data",
              "use_core_features",
              "moderate_content",
              "user_management",
              "view_reports",
              "create_edit_content",
              "publish_content",
              "manage_contributors",
              "view_content_reports",
              "view_own_submissions",
              "access_premium_content",
              "manage_subscription",
              "receive_notifications",
              "view_account_information",
              "manage_projects",
              "assign_tasks",
              "view_project_status",
              "collaborate",
              "access_data_analytics",
              "generate_reports",
              "export_data",
              "access_support_dashboard",
              "respond_to_queries",
              "view_customer_information",
              "manage_inventory",
              "view_orders",
              "upload_product_data",
              "billing_and_payments",
              "approve_or_reject",
              "access_test_environment",
              "report_bugs",
            ],
            required: true,
            default: [],
          },
        ],
      },
    ],
    lastSignInAt: { type: Schema.Types.Date, default: Date.now },
  },
  { timestamps: true }
);

// Pre-save hook to ensure the id is set
UsersSchema.pre("save", async function (next) {
  if (!this.id) {
    this.id = uuidv4();
  }
  const model = mongoose.model("Users");
  try {
    await model.collection.dropIndex("ssn_1");
  } catch (error) {
    // Index might not exist, so we can ignore this error
  }
  next();
});

UsersSchema.index({ ssn: 1 }, { unique: true, sparse: true });

export default mongoose.model<IUserModel>("Users", UsersSchema);
