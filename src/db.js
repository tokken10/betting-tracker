import mongoose from 'mongoose';

// Reuse the same Mongoose connection across hot reloads or serverless
// function invocations.  The `globalThis` scope survives for the lifetime
// of the runtime so we store the connection state there.  Each cold start
// will initialise this object once and subsequent invocations will reuse
// the existing connection instead of creating a new one.
let cached = globalThis.mongooseConn;
if (!cached) {
  cached = globalThis.mongooseConn = { conn: null, promise: null };
}

const { MONGO_URI } = process.env;
if (!MONGO_URI) {
  throw new Error('Missing MONGO_URI');
}

export default async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, { bufferCommands: false })
      .then(m => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}