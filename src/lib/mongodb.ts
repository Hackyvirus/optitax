import mongoose from "mongoose";

const g = globalThis as typeof globalThis & {
  mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

if (!g.mongoose) {
  g.mongoose = {
    conn: null,
    promise: null,
  };
}

export default async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI");
  }

  if (g.mongoose!.conn) {
    return g.mongoose!.conn;
  }

  if (!g.mongoose!.promise) {
    g.mongoose!.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    g.mongoose!.conn = await g.mongoose!.promise;
  } catch (err) {
    g.mongoose!.promise = null;
    throw err;
  }

  return g.mongoose!.conn;
}