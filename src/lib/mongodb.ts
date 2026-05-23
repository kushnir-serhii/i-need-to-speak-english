import mongoose from 'mongoose'

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

const globalWithMongoose = global as typeof globalThis & {
  _mongooseCache: MongooseCache
}

if (!globalWithMongoose._mongooseCache) {
  globalWithMongoose._mongooseCache = { conn: null, promise: null }
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  const cache = globalWithMongoose._mongooseCache

  if (cache.conn) {
    return cache.conn
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri).then((m) => m)
  }

  cache.conn = await cache.promise
  return cache.conn
}
