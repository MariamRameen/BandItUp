const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    sentBy: { type: String, enum: ["admin", "user"], required: true },
    senderName: { type: String, required: true },
  },
  { timestamps: true }
);

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
    replies: [replySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);