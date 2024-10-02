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
            type: Schema.Types.ObjectId,
            ref: "ServiceTable",
            required: true,
          },
        ],
        LIST_FOOD: [
          {
            FOOD_ID: {
              type: Schema.Types.ObjectId,
              required: false,
              ref: "Food",
            },
            QUANTITY: {
              type: Number,
              required: false,
            },
            _id: false,
          },
        ],
        _id: false,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Cart = mongoose.model("Cart", CartSchema);

module.exports = Cart;
