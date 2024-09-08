const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    NAME: {
      type: String,
      required: true,
    },
    TYPE: {
      type: String,
      enum: ["Fried chicken", "Pasta", "Burger", "Dessert", "Drinks"],
      required: true,
    },
    PRICE: {
      type: String,
      required: true,
    },
    DESCRIPTION: {
      type: String,
    },
    IMAGES: {
      type: [String],
    },
    AVAILABILITY: {
      type: Boolean,
      required: true,
    },
    NEWEST: {
      type: Boolean,
      required: false,
    },
    BEST: {
      type: Boolean,
      required: false,
    },
    IS_DELETED: {
      type: Boolean,
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Food = mongoose.model("Food", foodSchema);

module.exports = Food;
