import mongoose from 'mongoose';
import connectDB from './src/lib/db';

async function testTransactions() {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    console.log("Transaction started successfully.");
    await session.abortTransaction();
  } catch (err) {
    console.error("Transaction failed:", err.message);
  } finally {
    session.endSession();
    mongoose.connection.close();
  }
}

testTransactions();
