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
    DETAIL: { type: String },
  },
  { _id: false }
);

const RestaurantSchema = new mongoose.Schema(
  {
    NAME: { type: String },
    ADDRESS: { type: addressSchema, required: true },
    STATE: {
      type: String,
      enum: ["Open", "Close", "Shut down"],
      required: true,
    },
    PHONE: { type: String, required: true },
    EMAIL: { type: String },
  },
  {
    timestamps: true,
    strict: "throw",
  }
);

RestaurantSchema.pre("save", function (next) {
  const { PROVINCE, DISTRICT, WARD } = this.ADDRESS;
  this.NAME = `TFOOD ${PROVINCE.NAME} ${DISTRICT.NAME} ${WARD.NAME}`;

  next();
});

const Restaurant = mongoose.model("Restaurant", RestaurantSchema);

module.exports = Restaurant;
