const mongoose = require("mongoose");

const FoodSchema = new mongoose.Schema(
  {
    FOOD_ID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    QUANTITY: {
      type: Number,
      required: true,
    },
    ORDER_DATE: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    USER_ID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    FOODS: {
      type: FoodSchema,
      required: true,
    },
    TOTAL_PRICE: {
      type: Number,
      required: true,
    },
    NOTE: {
      type: String,
      required: true,
    },
    STATUS: {
      type: String,
      enum: ["Booked", "Canceled", "Completed"],
      required: true,
    },
    CREATE_AT: {
      type: Date,
      required: true,
    },
    UPDATE_AT: {
      type: Date,
    },
    ORDER_TYPE: {
      type: String,
      enum: ["Calling", "Email", "Website", "Live"],
    },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "CREATE_AT", updatedAt: "UPDATE_AT" },
  }
);

const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;
