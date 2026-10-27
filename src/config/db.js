import mongoose from 'mongoose';
import dns from 'dns';

// Some networks fail Atlas SRV lookups; allow opting in to public DNS via env.
if (process.env.USE_PUBLIC_DNS === 'true') {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
}

// Cache the connection promise across warm serverless invocations.
const cache = (globalThis.__hcmMongoCache ??= { promise: null });

export default async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
        bufferCommands: false,
      })
      .then((m) => m.connection)
      .catch((error) => {
        cache.promise = null; // allow retry on next request
        console.error('[MongoDB] connection failed:', error.name, error.message);
        throw error;
      });
  }
  return cache.promise;
}
