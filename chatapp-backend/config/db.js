const mongoose = require("mongoose");
const colors = require("colors");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables from .env file

mongoose.set('strictQuery', false); // Handle Mongoose deprecation warning

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error(`Error: MONGO_URI environment variable is not set`.red.bold);
    process.exit(1); // Exit with a non-zero status code to indicate an error
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.bold);
    console.error(error.stack); // Log error stack trace
    process.exit(1); // Exit with a non-zero status code to indicate an error
  }
};

module.exports = connectDB;