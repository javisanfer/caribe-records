const mongoose = require('mongoose');

const DEFAULT_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1_000;

const wait = (milliseconds) => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

async function connectDatabase() {
  let lastError;

  for (let attempt = 1; attempt <= DEFAULT_ATTEMPTS; attempt += 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        family: 4,
        maxPoolSize: 5,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 5_000,
      });
      console.info("Successfully connected to MongoDB");
      return mongoose.connection;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB connection attempt ${attempt} failed`);

      if (attempt < DEFAULT_ATTEMPTS) {
        await wait(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError;
}

process.on('SIGINT', () => {
  mongoose.connection.close()
    .finally(() => {
      console.log(`Database connection closed`);
      process.exit(0);
    })
});

module.exports = { connectDatabase };
