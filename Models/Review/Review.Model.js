const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    review_Id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    USER_ID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    ORDER_ID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    FOOD_ID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    RATING: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    COMMENT: {
      type: String,
    },
    STATUS: {
      type: Boolean,
      required: true,
    },
    CREATE_AT: {
      type: Date,
      required: true,
      default: Date.now,
    },
    UPDATE_AT: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "CREATE_AT", updatedAt: "UPDATE_AT" },
    versionKey: false,
  }
);

module.exports = mongoose.model("Review", reviewSchema);
