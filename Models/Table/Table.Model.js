const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BookingTimeSchema = new Schema({
  START_TIME: {
    type: String,
    required: true,
  },
  STATUS: {
    type: String,
    required: false,
  },
  USER_ID: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  _id: false, // Không tạo _id cho subdocument này
});

const TableSchema = new Schema(
  {
    TABLE_NUMBER: {
      type: String,
      required: false,
    },
    TYPE: {
      type: String,
      enum: ["Room", "Normal"],
      required: true,
    },

    DESCRIPTION: {
      type: String,
    },
    IMAGES: {
      type: [String],
    },
    BOOKING_TIMES: [BookingTimeSchema],
    CAPACITY: {
      type: Number,
      enum: [2, 4, 6, 8], // Giới hạn sức chứa với các giá trị cố định
      required: true,
    },
    IS_DELETED: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Hook để tự động tạo TABLE_NUMBER
TableSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      let prefix = "";
      if (this.TYPE === "Room") {
        prefix = "P"; // Mã bắt đầu cho Room là P
      } else if (this.TYPE === "Normal") {
        prefix = "B"; // Mã bắt đầu cho Normal là B
      }

      // Lấy bàn cuối cùng theo loại tương ứng
      const lastTable = await mongoose
        .model("Table")
        .findOne({ TYPE: this.TYPE })
        .sort({ TABLE_NUMBER: -1 });

      let nextNumber = "01";
      if (lastTable) {
        const lastNumber = parseInt(lastTable.TABLE_NUMBER.slice(1), 10);
        nextNumber = (lastNumber + 1).toString().padStart(2, "0");
      }

      this.TABLE_NUMBER = `${prefix}${nextNumber}`;
    } catch (error) {
      return next(error);
    }
  }

  next();
});

const Table = mongoose.model("Table", TableSchema);

module.exports = Table;
