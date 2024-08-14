const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    payment_Id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    ORDER_ID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    USER_ID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    PAYMENT_METHOD: {
      type: String,
      enum: ["Credit Card", "PayPal", "ZaloPay"],
      required: true,
    },
    STATUS: {
      type: String,
      enum: ["Completed", "Pending", "Failed"],
      required: true,
    },
    AMOUNT: {
      type: Number,
      required: true,
    },
    DELIVERY_FEES: {
      type: Number,
      required: true,
    },
    PAID: {
      type: Number,
      required: true,
    },
    CREATE_AT: {
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

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
