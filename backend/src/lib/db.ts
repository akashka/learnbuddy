import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition-platform';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

/**
 * Read preference for replica sets. Use 'secondaryPreferred' to route reads to secondaries
 * when available (reduces load on primary). Falls back to primary when no replica exists.
 * Set to 'primary' to disable read replicas.
 */
const READ_PREFERENCE = (process.env.MONGODB_READ_PREFERENCE || 'secondaryPreferred') as
  | 'primary'
  | 'primaryPreferred'
  | 'secondary'
  | 'secondaryPreferred'
  | 'nearest';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, {
      readPreference: READ_PREFERENCE,
    });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}

export default connectDB;
