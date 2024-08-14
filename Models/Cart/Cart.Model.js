const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema(
  {
    USER_ID: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    LIST_FOOD: [
      {
        FOOD_ID: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        QUANTITY: {
          type: Number,
          required: true,
        },
      },
    ],
    TOTAL_PRICES: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: false, // Optional: to add createdAt and updatedAt fields automatically
    versionKey: false, // Optional: to remove the __v field
  }
);

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
