const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    RESTAURANT_ID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    TYPE: {
      type: String,
      enum: ["Combo", "Fried chicken", "Pasta", "Burger", "Dessert", "Drinks"],
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
    DISCOUNT: {
      type: Number,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Food = mongoose.model("Food", foodSchema);

module.exports = Food;
