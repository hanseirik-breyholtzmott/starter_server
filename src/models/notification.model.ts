import mongoose, { Schema, Document } from 'mongoose';
import { IUserModel } from './users.model';

// Define the INotification interface
export interface INotification {
  userId: string | IUserModel;
  title: string; 
  message: string; 
  type: 'info' | 'warning' | 'error' | 'success'; 
  read: 'unread' | 'read' | 'archived'; 
  createdAt: Date; 
  updatedAt: Date;
}

// Define the INotificationModel interface, extending INotification and Document
export interface INotificationModel extends INotification, Document {}

// Define the schema for notifications
const NotificationSchema: Schema<INotificationModel> = new Schema({
  userId: { type: String, ref: 'Users', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info', enum: ['info', 'warning', 'error', 'success'] },
  read: { type: String, default: 'unread', enum: ['unread', 'read', 'archived'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware to update the `updatedAt` field on document updates
NotificationSchema.pre('save', function (next) {
  this.updatedAt = new Date();  // Ensure updatedAt is a Date object
  next();
});

export default mongoose.model<INotificationModel>('Notification', NotificationSchema);
