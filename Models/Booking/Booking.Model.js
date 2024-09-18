const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BookingSchema = new Schema(
  {
    USER_ID: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    LIST_ROOMS: [
      {
        ROOM_ID: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "Room",
        },
        START_DATE: {
          type: Date,
          required: true,
        },
        END_DATE: {
          type: Date,
          required: true,
        },
        TOTAL_PRICE_ROOM: {
          type: Number,
          required: true,
        },
      },
    ],
    TOTAL_PRICE: {
      type: Number,
      required: true,
    },
    STATUS: {
      type: String,
      enum: ["NotYetPaid", "Booked", "CheckedIn", "Canceled", "CheckedOut"],
      required: true,
    },
    BOOKING_TYPE: {
      type: String,
      enum: ["Calling", "Email", "Website", "Live"],
    },
    CUSTOMER_PHONE: {
      type: String,
      required: true,
    },
    CUSTOMER_NAME: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", BookingSchema);

module.exports = Booking;
