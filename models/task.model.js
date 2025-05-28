const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default:false,
    }
  },
  { timestamps: true }
);

const Task = mongoose.model("tasks", taskSchema);

module.exports = Task;
