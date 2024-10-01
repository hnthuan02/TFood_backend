const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BookingSchema = new Schema(
  {
    USER_ID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
            _id: false,
          },
        ],
        LIST_FOOD: [
          {
            FOOD_ID: {
              type: Schema.Types.ObjectId,
              ref: "Food",
              required: false,
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
    TOTAL_PRICE: {
      type: Number,
      required: true,
    },
    STATUS: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    PAYMENT_STATUS: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    PAYMENT_METHOD: {
      type: String,
      enum: ["cash", "credit_card", "paypal"],
      default: "cash",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Booking = mongoose.model("Booking", BookingSchema);

module.exports = Booking;
