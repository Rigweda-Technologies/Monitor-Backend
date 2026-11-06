import mongoose from 'mongoose';
export const connectDatabase = async config => {
  const connection = mongoose.createConnection(config.mongoUri, { autoCreate: false, autoIndex: false, maxPoolSize: config.poolMax, serverSelectionTimeoutMS: config.timeoutMs, connectTimeoutMS: config.timeoutMs, socketTimeoutMS: config.timeoutMs, bufferCommands: false });
  try { await connection.asPromise(); return connection; }
  catch (error) { await connection.close().catch(() => {}); throw error; }
};
