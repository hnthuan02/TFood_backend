const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MetadataUserSchema = new Schema(
  {
    USER_ID: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    TOTAL_ORDERS: {
      type: Number,
      required: true,
    },
    TOTAL_CANCELLATIONS: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
    strict: true, // Không cho phép các thuộc tính không định nghĩa trong schema
  }
);

const MetadataUser = mongoose.model("MetadataUser", MetadataUserSchema);

module.exports = MetadataUser;
