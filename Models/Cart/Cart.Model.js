const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CartSchema = new Schema(
  {
    USER_ID: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    LIST_TABLES: [
      {
        TABLE_ID: {
          type: Schema.Types.ObjectId,
          ref: "Table",
          required: true,
        },
        BOOKING_TIME: {
          type: String,
          required: true,
        },
        SERVICES: [
          {
            serviceName: String,
            servicePrice: Number,
          },
        ],
        LIST_FOOD: [
          {
            FOOD_ID: {
              type: Schema.Types.ObjectId,
              required: true,
              ref: "Food",
            },
            QUANTITY: {
              type: Number,
              required: true,
            },
            TOTAL_PRICE_FOOD: {
              type: Number,
              default: 0,
            },
          },
        ],
      },
    ],
    TOTAL_PRICES: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Cart = mongoose.model("Cart", CartSchema);

module.exports = Cart;
