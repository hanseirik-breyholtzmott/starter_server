import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IProduct extends Document {
  productId: string;
  name: string;
  description: string;
  price: number;
  surcharge: number;
  category: string;
  stock: number; // Number of items available in stock
  imageUrl: string;
}

export interface IProductModel extends IProduct, Document {}

const ProductSchema: Schema = new Schema<IProduct>(
  {
    productId: {
      type: Schema.Types.String,
      unique: true,
      default: () => uuidv4(),
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    surcharge: { type: Number, required: true, default: 0 },
    category: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    imageUrl: { type: String, required: false },
  },
  { timestamps: true }
);

export default mongoose.model<IProductModel>("Product", ProductSchema);
