const FOOD_MODEL = require("../../Models/Food/Food.Model");

class FOOD_SERVICE {
  async checkFoodExists(name) {
    const searchConditions = [];

    if (name) {
      searchConditions.push({ NAME: name });
    }

    if (searchConditions.length === 0) {
      return null;
    }

    return await FOOD_MODEL.findOne({
      $or: searchConditions,
    }).lean();
  }
  // Tạo món ăn mới
  async createFood(body) {
    try {
      const newFood = new FOOD_MODEL(body);
      const result = await newFood.save();
      return result.toObject();
    } catch (error) {
      console.error("Error creating food:", error);
      throw new Error("Error creating food");
    }
  }

  // Xoá món ăn theo ID
  async deleteFood(foodId) {
    const result = await FOOD_MODEL.findByIdAndUpdate(
      foodId,
      { $set: { IS_DELETED: true } },
      { new: true, runValidators: true } // `new: true` để trả về tài liệu đã cập nhật
    );
    if (!result) {
      throw new Error("Food not found");
    }
    return result.toObject();
  }

  // Cập nhật thông tin món ăn, bao gồm URL của ảnh
  async updateFood(foodId, updateData) {
    try {
      const result = await FOOD_MODEL.findByIdAndUpdate(foodId, updateData, {
        new: true,
      });
      if (!result) {
        throw new Error("Food not found");
      }
      return result;
    } catch (error) {
      console.error("Error updating food:", error);
      throw new Error("Error updating food");
    }
  }

  // Lấy toàn bộ món ăn
  async getAllFoods() {
    try {
      return await FOOD_MODEL.find({
        IS_DELETED: { $in: [false, null] },
      }).lean();
    } catch (error) {
      console.error("Error retrieving foods:", error);
      throw new Error("Error retrieving foods");
    }
  }

  // Lấy món ăn theo TYPE, NEWEST hoặc BEST
  async getFoodsByCriteria(criteria) {
    try {
      const { TYPE, NEWEST, BEST } = criteria;
      let query = {};

      if (TYPE) {
        query.TYPE = TYPE;
      }
      if (NEWEST) {
        query.NEWEST = NEWEST;
      }
      if (BEST) {
        query.BEST = BEST;
      }

      return await FOOD_MODEL.find(query).lean();
    } catch (error) {
      console.error("Error retrieving foods by criteria:", error);
      throw new Error("Error retrieving foods by criteria");
    }
  }
}

module.exports = new FOOD_SERVICE();
