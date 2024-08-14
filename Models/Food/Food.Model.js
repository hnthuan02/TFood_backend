const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    food_Id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    RESTAURANT_ID: {
      type: mongoose.Schema.Types.ObjectId,
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
    CREATE_AT: {
      type: Date,
      required: true,
    },
    UPDATE_AT: {
      type: Date,
      required: true,
    },
    DISCOUNT: {
      type: Number,
    },
  },
  {
    timestamps: { createdAt: "CREATE_AT", updatedAt: "UPDATE_AT" },
    versionKey: false,
  }
);

const Food = mongoose.model("Food", foodSchema);

module.exports = Food;
