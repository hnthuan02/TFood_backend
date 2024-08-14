const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const metadataFoodSchema = new Schema(
  {
    FOOD_ID: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    TOTAL_ORDERS: {
      type: Number,
      required: true,
    },
    TOTAL_REVIEWS: {
      type: Number,
      required: true,
    },
    AVERAGE_RATING: {
      type: Number,
      required: true,
    },
  },
  {
    versionKey: false, // Tắt trường __v mà Mongoose thêm vào
    strict: true, // Chỉ cho phép các trường được định nghĩa trong schema
  }
);

const MetadataFood = mongoose.model("MetadataFood", metadataFoodSchema);

module.exports = MetadataFood;
