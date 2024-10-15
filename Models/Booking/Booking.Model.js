const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BookingSchema = new Schema(
  {
    USER_ID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    USER_NAME: {
      type: String,
      required: true,
    },
    PHONE_NUMBER: {
      type: String,
      required: true,
    },
    EMAIL: {
      type: String,
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
            SERVICES_ID: {
              type: Schema.Types.ObjectId,
              ref: "ServiceTable", // Đảm bảo rằng đây là tên đúng của model dịch vụ
              required: false,
            },
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
      enum: ["NotYetPaid", "Booked", "Canceled", "Completed"],
      required: false,
    },
    BOOKING_TYPE: {
      type: String,
      enum: ["Calling", "Email", "Website", "Live"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Booking = mongoose.model("Booking", BookingSchema);

module.exports = Booking;
