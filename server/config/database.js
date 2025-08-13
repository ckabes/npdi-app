const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app', {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    console.error('Make sure MongoDB is running on your system');
    console.error('Start MongoDB with: sudo systemctl start mongod (Linux) or brew services start mongodb-community (macOS)');
    process.exit(1);
  }
};

module.exports = connectDB;