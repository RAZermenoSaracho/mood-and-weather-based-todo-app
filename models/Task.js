const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    desc: { type: String },
    date: { type: String, required: true },
    weather: { type: String, enum: ["sunny", "cloudy", "rainy"], required: true },
    completed: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);
