const FOOD_SERVICE = require("../../Services/Food/Food.Service");
const CLOUDINARY = require("../../Config/cloudinaryConfig");

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
      let uploadedImages = [];
      if (req.files && req.files.length > 0) {
        uploadedImages = await Promise.all(
          req.files.map(async (file) => {
            const uploadResult = await CLOUDINARY.uploader.upload(file.path); // Upload lên Cloudinary
            return uploadResult.secure_url; // Trả về URL ảnh đã upload
          })
        );
      }

      // **Upload ảnh từ URL (nếu có)**
      if (payload.IMAGES && payload.IMAGES.length > 0) {
        const urlUploads = await Promise.all(
          payload.IMAGES.map(async (imageUrl) => {
            if (imageUrl.startsWith("http")) {
              const uploadResult = await CLOUDINARY.uploader.upload(imageUrl); // Upload từ URL
              return uploadResult.secure_url;
            }
          })
        );
        uploadedImages = uploadedImages.concat(urlUploads); // Kết hợp cả ảnh từ file và URL
      }
      payload.IMAGES = uploadedImages;
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
    const foodId = req.params.foodId;
    const payload = req.body;

    try {
      let uploadedImages = [];

      // **Upload ảnh từ file (nếu có)**
      if (req.files && req.files.length > 0) {
        uploadedImages = await Promise.all(
          req.files.map(async (file) => {
            const uploadResult = await CLOUDINARY.uploader.upload(file.path); // Upload lên Cloudinary
            return uploadResult.secure_url; // Trả về URL ảnh đã upload
          })
        );
      }

      // **Upload ảnh từ URL (nếu có)**
      if (payload.IMAGES && payload.IMAGES.length > 0) {
        const urlUploads = await Promise.all(
          payload.IMAGES.map(async (imageUrl) => {
            if (imageUrl.startsWith("http")) {
              const uploadResult = await CLOUDINARY.uploader.upload(imageUrl); // Upload từ URL
              return uploadResult.secure_url;
            }
          })
        );
        uploadedImages = uploadedImages.concat(urlUploads); // Kết hợp cả ảnh từ file và URL
      }

      // Gán ảnh đã upload vào payload
      payload.IMAGES = uploadedImages;

      // Gọi service để cập nhật khách sạn
      const updatedFood = await FOOD_SERVICE.updateFood(foodId, payload);

      if (updatedFood) {
        return res.status(200).json({
          message: "Món ăn đã được cập nhật thành công.",
          data: updatedFood,
        });
      } else {
        return res.status(404).json({ message: "Món ăn không tìm thấy." });
      }
    } catch (err) {
      return res.status(500).json({
        message: "Lỗi khi cập nhật món ăn!",
        error: err.message,
      });
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

  async searchFood(req, res) {
    const searchParams = req.body; // Nhận tham số từ body

    try {
      const foods = await FOOD_SERVICE.searchFood(searchParams);

      if (!foods.success) {
        return res.status(400).json({
          success: false,
          message: foods.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: foods.data, // Trả về kết quả tìm kiếm
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error searching foods",
        error: error.message,
      });
    }
  }
}

module.exports = new FOOD_CONTROLLER();
