import mongoose from "mongoose";

/** Connects Mongoose before the HTTP server starts accepting requests. */
export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required");
  await mongoose.connect(uri);
  console.log("Connected to MongoDB Atlas");
}
