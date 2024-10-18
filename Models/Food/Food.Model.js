const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    NAME: {
      type: String,
      required: true,
    },
    TYPE: {
      type: String,
      enum: ["Steak", "Pasta", "Dessert", "Drink"],
      required: true,
    },
    PRICE: {
      type: Number,
      required: true,
    },
    DESCRIPTION: {
      type: String,
    },
    IMAGES: {
      type: [String],
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
