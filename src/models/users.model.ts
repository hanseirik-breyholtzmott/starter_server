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

// Define the IUser interface
export interface IUser {
  user_id: string;
  ssn: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  username: string | null;
  hasImage: boolean;
  imageUrl: string | null;
  address: IAddress | null;
  primaryEmailAddress: string | null;
  emailAddresses: Array<string>;
  primaryPhoneNumber: any | null;
  phoneNumbers: Array<any>;
  hasVerifiedPhoneNumber: boolean;
  hasVerifiedPrimaryEmailAddress: boolean;
  passwordEnabled: boolean;
  password: string;
  resetPasswordToken: string | null;
  resetPasswordExpiresAt: Date | null;
  verificationToken: string | null;
  verificationTokenExpiresAt: Date | null;
  deleteSelfEnabled: boolean;
  stripeCustomerId: string | null; // Stripe customer ID
  roles: string;
  permissions: Array<string>;
  lastSignInAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Define the IUserModel interface, extending IUser and Document
export interface IUserModel extends IUser, Document {}

//Define the AddressSchema with Mongoose
const AddressSchema = new Schema({
  street: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  zipCode: { type: String, required: false },
});

// Define the UsersSchema with Mongoose
const UsersSchema = new Schema({
  user_id: { type: String, unique: true, default: () => uuidv4() },
  ssn: { type: String, unique: true, default: null },
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  fullName: { type: String, default: null },
  username: { type: String, default: null },
  hasImage: { type: Boolean, default: false },
  imageUrl: { type: String, default: null },
  address: { type: AddressSchema, default: null },
  primaryEmailAddress: { type: String, unique: true, default: null },
  emailAddresses: { type: [Schema.Types.Mixed], default: [] },
  primaryPhoneNumber: { type: Schema.Types.Mixed, default: null },
  phoneNumbers: { type: [Schema.Types.Mixed], default: [] },
  hasVerifiedPhoneNumber: { type: Boolean, default: false },
  hasVerifiedPrimaryEmailAddress: { type: Boolean, default: false },
  passwordEnabled: { type: Boolean, default: false },
  password: { type: String, required: true },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpiresAt: { type: Date, default: null },
  verificationTokenExpiresAt: { type: Date, default: null },
  verificationToken: { type: String, default: null },
  deleteSelfEnabled: { type: Boolean, default: false },
  stripeCustomerId: { type: String, default: null },
  roles: {
    type: String,
    enum: ["admin", "user", "moderator"],
    default: "user",
  },
  permissions: { type: [String], default: [] },
  lastSignInAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save hook to ensure the id is set
UsersSchema.pre("save", function (next) {
  if (!this.id) {
    this.id = uuidv4();
  }
  next();
});

export default mongoose.model<IUserModel>("Users", UsersSchema);
