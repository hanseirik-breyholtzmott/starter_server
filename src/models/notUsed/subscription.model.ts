import mongoose, { Schema, Document } from 'mongoose';
import { IUserModel } from './users.model';

export interface ISubscription extends Document {
  user: mongoose.Types.ObjectId | IUserModel;
  stripeSubscriptionId: string; // Stripe subscription ID
  plan: string; // Subscription plan identifier
  status: string; // Status of the subscription (e.g., 'active', 'canceled')
  startDate: Date; // When the subscription starts
  endDate: Date; // When the subscription ends
  renewalDate: Date; // Next renewal date
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema<ISubscription>({
  user: { type: mongoose.Types.ObjectId, ref: 'Users', required: true },
  stripeSubscriptionId: { type: String, required: true },
  plan: { type: String, required: true },
  status: { type: String, default: 'active' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  renewalDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

SubscriptionSchema.pre<ISubscription>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
export default Subscription;
