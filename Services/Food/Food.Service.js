const FOOD_MODEL = require("../../Models/Food/Food.Model");
const CLOUDINARY = require("../../Config/cloudinaryConfig");

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
      let uploadedImages = []; // Đảm bảo biến được định nghĩa trước
      console.log("Uploaded images:", uploadedImages);

      if (body.IMAGES && body.IMAGES.length > 0) {
        uploadedImages = await Promise.all(
          body.IMAGES.map(async (image) => {
            // Kiểm tra nếu là URL hoặc file path cục bộ
            if (typeof image === "string" && image.startsWith("http")) {
              // Upload từ URL
              const uploadResult = await CLOUDINARY.uploader.upload(image);
              return uploadResult.secure_url;
            } else if (image.path) {
              // Upload từ file cục bộ
              const uploadResult = await CLOUDINARY.uploader.upload(image.path);
              return uploadResult.secure_url;
            }
          })
        );
      }
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
  async updateFood(id, foodData) {
    let uploadedImages = [];

    if (foodData.IMAGES && foodData.IMAGES.length > 0) {
      uploadedImages = await Promise.all(
        foodData.IMAGES.map(async (image) => {
          if (typeof image === "string" && image.startsWith("http")) {
            // Nếu là URL thì giữ nguyên
            return image;
          } else if (image.path) {
            // Nếu là file cục bộ, upload lên Cloudinary
            const uploadResult = await CLOUDINARY.uploader.upload(image.path);
            return uploadResult.secure_url;
          }
        })
      );
      // Gán danh sách ảnh đã upload vào trường IMAGES trong foodData
      foodData.IMAGES = uploadedImages;
    }
    const updateFood = await FOOD_MODEL.findByIdAndUpdate(
      id,
      {
        ...foodData,
      },
      { new: true }
    );
    return updateFood;
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

  async searchFood(searchParams) {
    const searchValue = searchParams.query; // Lấy giá trị query từ searchParams

    // Kiểm tra nếu không có tham số nào được truyền
    if (!searchValue) {
      console.log("Không có tham số tìm kiếm, trả về danh sách rỗng.");
      return { success: false, message: "Không có tham số tìm kiếm." }; // Trả về object thông báo lỗi
    }

    const query = {
      $or: [
        { NAME: { $regex: new RegExp(searchValue, "i") } }, // Tìm kiếm không phân biệt hoa thường theo TOUR_NAME
      ],
    };

    try {
      const foods = await FOOD_MODEL.find(query).populate({
        path: "_id",
        select: "NAME",
        model: "Food",
      });

      if (foods.length === 0) {
        return { success: false, message: "Không tìm thấy món ăn." }; // Trả về object thông báo lỗi
      }

      return { success: true, data: foods }; // Trả về danh sách các tour tìm thấy
    } catch (error) {
      throw new Error("Error searching for tours: " + error.message);
    }
  }
}

module.exports = new FOOD_SERVICE();
