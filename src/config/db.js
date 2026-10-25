
import mongoose from 'mongoose';

let cached = globalThis.__hcmMongoCache;

if (!cached) {
  cached = globalThis.__hcmMongoCache = {
    connection: null,
    promise: null,
  };
}

export default async function connectDB() {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    console.log(
      '[MongoDB] Already connected:',
      mongoose.connection.name
    );
    return mongoose.connection;
  }

  // Check environment variable
  if (!process.env.MONGODB_URI) {
    console.error('[MongoDB] ERROR: MONGODB_URI is not configured');
    throw new Error('MONGODB_URI is not configured');
  }

  // Reuse cached connection promise
  if (!cached.promise) {
    console.log('[MongoDB] Connecting to Atlas...');

    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
        bufferCommands: false,
      })
      .then((instance) => {
        cached.connection = instance.connection;

        console.log('[MongoDB] Connected successfully');
        console.log('[MongoDB] Database:', instance.connection.name);
        console.log(
          '[MongoDB] Ready state:',
          instance.connection.readyState
        );

        return instance.connection;
      })
      .catch((error) => {
        cached.promise = null;
        cached.connection = null;

        console.error('[MongoDB] CONNECTION FAILED');
        console.error('[MongoDB] Error name:', error.name);
        console.error('[MongoDB] Error message:', error.message);

        throw error;
      });
  }

  try {
    cached.connection = await cached.promise;
    return cached.connection;
  } catch (error) {
    console.error('[MongoDB] connectDB() failed:', error.message);
    throw error;
  }
}
