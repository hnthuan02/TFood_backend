const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Danh sách dịch vụ có sẵn và giá của chúng
const SERVICES_LIST = [
  { serviceName: "Karaoke", servicePrice: 100 },
  { serviceName: "Phục vụ riêng", servicePrice: 200 },
  { serviceName: "Đồ uống không giới hạn", servicePrice: 150 },
  { serviceName: "Truyền hình trực tiếp", servicePrice: 75 },
];

// Schema cho dịch vụ
const ServiceSchema = new Schema({
  serviceName: {
    type: String,
    enum: SERVICES_LIST.map((service) => service.serviceName),
    required: true,
  },
  servicePrice: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        const service = SERVICES_LIST.find(
          (s) => s.serviceName === this.serviceName
        );
        return service && service.servicePrice === value;
      },
      message: "Giá dịch vụ không hợp lệ.",
    },
  },
});

const AvailabilitySchema = new Schema({
  DATE: {
    type: Date,
    required: true,
  },
  AVAILABLE: {
    type: Boolean,
    required: true,
  },
  _id: false, // Disable the creation of an _id field for this subdocument
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
    PRICE: {
      type: Number,
      required: true,
    },
    DESCRIPTION: {
      type: String,
    },
    IMAGES: {
      type: [String],
    },
    AVAILABILITY: [AvailabilitySchema],
    SERVICES: {
      type: [ServiceSchema],
      required: function () {
        return this.TYPE === "Room";
      },
    },
    CAPACITY: {
      type: Number,
      enum: [2, 4, 6, 8], // Giới hạn sức chứa với các giá trị cố định
      required: true,
    },
    IS_DELETED: {
      type: Boolean,
      default: false,
    },
    DEPOSIT: {
      type: Number,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Hook để tự động tạo TABLE_NUMBER và tự động thêm dịch vụ
TableSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Tự động tạo TABLE_NUMBER cho Room
    if (this.TYPE === "Room") {
      try {
        const prefix = "P";
        const lastTable = await mongoose
          .model("Table")
          .findOne({ TYPE: "Room" })
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

      // Tự động thêm tất cả các dịch vụ từ SERVICES_LIST
      this.SERVICES = SERVICES_LIST.map((service) => ({
        serviceName: service.serviceName,
        servicePrice: service.servicePrice,
      }));
    }
  }

  // Tính tiền cọc 30%
  if (this.PRICE) {
    this.DEPOSIT = this.PRICE * 0.3;
  }

  next();
});

const Table = mongoose.model("Table", TableSchema);

module.exports = Table;
