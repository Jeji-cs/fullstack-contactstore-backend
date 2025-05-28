const mongoose = require("mongoose");

const establishConnection = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/UserAuth", {});
    console.log("MongoDB Connected Successfully!");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    process.exit(1); // Exit process on failure
  }
};

module.exports = establishConnection;
