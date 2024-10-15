import mongoose, { Schema, Document } from "mongoose";

// Define the INotification interface
export interface INotification {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  read: "unread" | "read" | "archived";
}

// Define the INotificationModel interface, extending INotification and Document
export interface INotificationModel extends INotification, Document {}

// Define the schema for notifications
const NotificationSchema: Schema<INotificationModel> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      default: "info",
      enum: ["info", "warning", "error", "success"],
    },
    read: {
      type: String,
      default: "unread",
      enum: ["unread", "read", "archived"],
    },
  },
  { timestamps: true }
);

export default mongoose.model<INotificationModel>(
  "Notification",
  NotificationSchema
);
