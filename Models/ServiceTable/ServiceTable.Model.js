const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ServiceTableSchema = new Schema(
  {
    serviceName: {
      type: String,
      required: true,
    },
    servicePrice: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["Room", "Normal"], // Loại dịch vụ Room hoặc Normal
      required: true,
    },
    IS_DELETED: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Để theo dõi thời gian tạo và cập nhật
  }
);

const ServiceTable = mongoose.model("ServiceTable", ServiceTableSchema);
module.exports = ServiceTable;
