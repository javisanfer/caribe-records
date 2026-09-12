const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.info("Successfully connected to MongoDB"))
  .catch((error) => {
    console.error("An error occurred trying to connect to MongoDB", error);
    process.exit(1);
  });

process.on('SIGINT', () => {
  mongoose.connection.close()
    .finally(() => {
      console.log(`Database connection closed`);
      process.exit(0);
    })
});
