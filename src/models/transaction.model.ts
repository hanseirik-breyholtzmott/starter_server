import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUserModel } from './users.model';
import { ISubscription } from './subscription.model';

interface IProduct {
  productId: Types.ObjectId;
  quantity: number;
  price: number;
}

export interface ITransaction {
  userId: string | IUserModel;
  stripePaymentId: string;
  transactionType: 'subscription' | 'product';
  subscription: string | ISubscription;
  amount: number; 
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
}



const TransactionSchema: Schema = new Schema<ITransaction>({
  userId: { type: mongoose.Types.ObjectId, ref: 'Users', required: true },
  stripePaymentId: { type: String, required: true, unique: true },
  transactionType: { type: String, required: true, enum: ['subscription', 'product'] },
  amount: { type: Number, required: true, min: [0, 'Transaction amount must be positive'], },
  currency: { type: String, required: true, default: 'nok', enum: ['pending', 'completed', 'failed', 'refunded'] },
  status: { type: String, default: 'pending',  },
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
export default Transaction;
