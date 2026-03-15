// ============================================
//   Database Configuration
//   Connects our app to MongoDB
// ============================================

const mongoose = require("mongoose");

// This function connects to MongoDB
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1); // Exit app if DB fails
  }
};

module.exports = connectDB;
