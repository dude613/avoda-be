import mongoose from "mongoose"

const timerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    task: {
      type: String,
      required: true,
    },
    project: {
      type: String,
      default: null,
    },
    client: {
      type: String,
      default: null,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
)

// Index to optimize queries for active timers by user
timerSchema.index({ user: 1, isActive: 1 })

const Timer = mongoose.model("Timer", timerSchema)

export default Timer