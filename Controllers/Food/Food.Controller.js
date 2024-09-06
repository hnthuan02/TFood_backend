const FOOD_SERVICE = require("../../Services/Food/Food.Service");

class FOOD_CONTROLLER {
  // Tạo món ăn mới
  async createFood(req, res) {
    const payload = req.body;
    const NAME = payload.NAME;
    try {
      const checkFoodExists = await FOOD_SERVICE.checkFoodExists(NAME);
      if (checkFoodExists) {
        return res.status(400).json({ message: "Tên món ăn đã tồn tại." });
      }
      const newFood = await FOOD_SERVICE.createFood(req.body);
      res.status(201).json(newFood);
    } catch (error) {
      console.error("Error creating food:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Xoá món ăn theo ID
  deleteFood = async (req, res) => {
    try {
      const { foodId } = req.params;

      if (!foodId) {
        return res.status(404).json({ message: "FoodID là bắt buộc." });
      }
      const result = await FOOD_SERVICE.deleteFood(foodId);
      return res.status(200).json({
        message: "Xóa món ăn thành công!!",
        data: result,
      });
    } catch (err) {
      return res.status(500).json({ message: "Lỗi khi xóa món ăn!!" });
    }
  };

  // Cập nhật thông tin món ăn, bao gồm URL của ảnh
  async updateFood(req, res) {
    try {
      const { foodId } = req.params;
      const updateData = req.body;
      const updatedFood = await FOOD_SERVICE.updateFood(foodId, updateData);
      res.status(200).json(updatedFood);
    } catch (error) {
      console.error("Error updating food:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Lấy toàn bộ món ăn
  async getAllFoods(req, res) {
    try {
      const foods = await FOOD_SERVICE.getAllFoods();
      res.status(200).json(foods);
    } catch (error) {
      console.error("Error retrieving foods:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Lấy món ăn theo TYPE, NEWEST hoặc BEST
  async getFoodsByCriteria(req, res) {
    try {
      const criteria = req.query;
      const foods = await FOOD_SERVICE.getFoodsByCriteria(criteria);
      res.status(200).json(foods);
    } catch (error) {
      console.error("Error retrieving foods by criteria:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new FOOD_CONTROLLER();
