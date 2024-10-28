const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MetadataTableSchema = new Schema(
  {
    TABLE_ID: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    TOTAL_BOOKING: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
    strict: true, // Không cho phép các thuộc tính không định nghĩa trong schema
  }
);

const MetadataTable = mongoose.model("MetadataTable", MetadataTableSchema);

module.exports = MetadataTable;
