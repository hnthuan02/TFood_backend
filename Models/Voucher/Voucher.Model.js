const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VoucherSchema = new Schema(
  {
    CODE: {
      type: String,
      required: true,
      unique: true,
    },
    DESCRIPTION: {
      type: String,
      required: true,
    },
    DISCOUNT_PERCENT: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    REQUIRED_POINTS: {
      type: Number,
      required: true,
    },
    EXPIRATION_DATE: {
      type: Date,
      required: true,
    },
    USAGE_LIMIT: {
      type: Number,
      required: true,
      default: 1,
    },
    STATUS: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Voucher", VoucherSchema);
