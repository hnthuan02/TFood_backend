const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const metadataRestaurantSchema = new Schema(
  {
    RESTAURANT_ID: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    FOOD_ID: {
      type: Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    IN_STOCK: {
      type: Boolean,
      required: true,
    },
  },
  {
    versionKey: false, // Tắt trường __v mà Mongoose thêm vào
    strict: true, // Chỉ cho phép các trường được định nghĩa trong schema
  }
);

const MetadataFood = mongoose.model(
  "metadataRestaurant",
  metadataRestaurantSchema
);

module.exports = metadataRestaurant;
