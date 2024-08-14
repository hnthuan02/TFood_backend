const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    PROVINCE: {
      NAME: { type: String, required: true },
      CODE: { type: Number, required: true },
    },
    DISTRICT: {
      NAME: { type: String, required: true },
      CODE: { type: Number, required: true },
    },
    WARD: {
      NAME: { type: String, required: true },
      CODE: { type: Number, required: true },
    },
    DESCRIPTION: { type: String },
  },
  { _id: false }
);

const restaurantSchema = new mongoose.Schema(
  {
    restaurant_Id: { type: mongoose.Schema.Types.ObjectId, required: true },
    NAME: { type: String, required: true },
    ADDRESS: { type: addressSchema, required: true },
    STATE: { type: String, required: true },
    PHONE: { type: String, required: true },
    EMAIL: { type: String, required: true },
    CREATE_AT: { type: Date, required: true, default: Date.now },
    UPDATE_AT: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: { createdAt: "CREATE_AT", updatedAt: "UPDATE_AT" },
    strict: "throw",
  }
);

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
