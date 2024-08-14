const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    PROVINCE: {
      NAME: { type: String, required: true },
      CODE: { type: Number, required: true },
    },
    DISTRICT: {
      NAME: { type: String, required: true },
    },
    WARD: {
      NAME: { type: String, required: true },
    },
    DESCRIPTION: { type: String },
  },
  { _id: false }
);

const RestaurantSchema = new mongoose.Schema(
  {
    NAME: { type: String, required: true },
    ADDRESS: { type: addressSchema, required: true },
    STATE: {
      type: String,
      enum: ["Open", "Close", "Shut down"],
      required: true,
    },
    PHONE: { type: String, required: true },
    EMAIL: { type: String, required: true },
  },
  {
    timestamps: true,
    strict: "throw",
  }
);

const Restaurant = mongoose.model("Restaurant", RestaurantSchema);

module.exports = Restaurant;
