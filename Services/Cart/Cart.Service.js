const CART_MODEL = require("../../Models/Cart/Cart.Model");
const TABLE_MODEL = require("../../Models/Table/Table.Model");
const FOOD_MODEL = require("../../Models/Food/Food.Model");

class CART_SERVICE {
  async createCart(userId) {
    const newCart = new CART_MODEL({
      USER_ID: userId,
      LIST_TABLES: [],
    });

    await newCart.save();
    return newCart;
  }

  async addTableToCart(userId, tableId, bookingTime, services, listFood) {
    let cart = await CART_MODEL.findOne({ USER_ID: userId });

    if (!cart) {
      cart = await this.createCart(userId);
    }

    // Tìm bàn trong giỏ hàng
    let tableInCart = cart.LIST_TABLES.find(
      (table) => table.TABLE_ID.toString() === tableId
    );

    let tablePrice = 0;
    if (tableInCart) {
      // Nếu bàn đã có trong giỏ hàng, kiểm tra và thêm dịch vụ mới (nếu có)
      for (const newService of services) {
        const isServiceExist = tableInCart.SERVICES.some(
          (service) => service.serviceName === newService.serviceName
        );
        if (!isServiceExist) {
          // Thêm dịch vụ nếu chưa tồn tại
          tableInCart.SERVICES.push(newService);
        }
      }

      // Duyệt qua từng món ăn trong danh sách
      for (const foodItem of listFood) {
        const foodInTable = tableInCart.LIST_FOOD.find(
          (food) => food.FOOD_ID.toString() === foodItem.FOOD_ID
        );

        if (foodInTable) {
          // Nếu món ăn đã tồn tại, cộng thêm số lượng (chỉ cộng 1 lần từ yêu cầu hiện tại)
          foodInTable.QUANTITY += foodItem.QUANTITY;
          foodInTable.TOTAL_PRICE_FOOD =
            (foodInTable.QUANTITY * foodInTable.TOTAL_PRICE_FOOD) /
            (foodInTable.QUANTITY - foodItem.QUANTITY);
        } else {
          // Nếu món ăn chưa tồn tại, thêm món mới
          const food = await FOOD_MODEL.findById(foodItem.FOOD_ID);
          if (!food) {
            throw new Error(`Food with ID ${foodItem.FOOD_ID} not found`);
          }

          tableInCart.LIST_FOOD.push({
            FOOD_ID: food._id,
            QUANTITY: foodItem.QUANTITY,
            TOTAL_PRICE_FOOD: food.PRICE * foodItem.QUANTITY,
          });
        }
      }

      // Lấy giá của bàn từ mô hình Table
      const table = await TABLE_MODEL.findById(tableId);
      if (!table) {
        throw new Error("Table not found");
      }
      tablePrice = table.PRICE;
    } else {
      // Nếu bàn chưa có trong giỏ hàng, thêm bàn mới
      const table = await TABLE_MODEL.findById(tableId);
      if (!table) {
        throw new Error("Table not found");
      }

      const listFoodItems = [];
      for (const foodItem of listFood) {
        const food = await FOOD_MODEL.findById(foodItem.FOOD_ID);
        if (!food) {
          throw new Error(`Food with ID ${foodItem.FOOD_ID} not found`);
        }
        listFoodItems.push({
          FOOD_ID: food._id,
          QUANTITY: foodItem.QUANTITY,
          TOTAL_PRICE_FOOD: food.PRICE * foodItem.QUANTITY,
        });
      }

      cart.LIST_TABLES.push({
        TABLE_ID: tableId,
        BOOKING_TIME: bookingTime,
        SERVICES: services,
        LIST_FOOD: listFoodItems,
      });

      // Lấy giá của bàn từ mô hình Table
      tablePrice = table.PRICE;
    }

    // Cập nhật tổng giá tiền bao gồm giá bàn, món ăn và dịch vụ
    const totalPrice = cart.LIST_TABLES.reduce((sumTable, table) => {
      const totalPriceFood = table.LIST_FOOD.reduce(
        (sumFood, food) => sumFood + food.TOTAL_PRICE_FOOD,
        0
      );
      const totalPriceServices = table.SERVICES.reduce(
        (sumService, service) => sumService + (service.servicePrice || 0),
        0
      ); // Tổng giá dịch vụ
      return sumTable + totalPriceFood + totalPriceServices;
    }, 0);

    // Cộng thêm giá bàn (tablePrice) vào tổng giá
    cart.TOTAL_PRICES = totalPrice + tablePrice;
    await cart.save();

    return cart;
  }

  async removeFoodFromTable(userId, tableId, foodId) {
    let cart = await CART_MODEL.findOne({ USER_ID: userId });

    if (!cart) {
      throw new Error("Cart not found");
    }

    // Tìm bàn trong giỏ hàng
    let tableInCart = cart.LIST_TABLES.find(
      (table) => table.TABLE_ID.toString() === tableId
    );

    if (!tableInCart) {
      throw new Error("Table not found in cart");
    }

    // Xóa món ăn khỏi LIST_FOOD
    tableInCart.LIST_FOOD = tableInCart.LIST_FOOD.filter(
      (food) => food.FOOD_ID.toString() !== foodId
    );

    await cart.save();
    return cart;
  }

  async removeTableFromCart(userId, tableId) {
    let cart = await CART_MODEL.findOne({ USER_ID: userId });

    if (!cart) {
      throw new Error("Cart not found");
    }

    // Xóa bàn khỏi LIST_TABLES
    cart.LIST_TABLES = cart.LIST_TABLES.filter(
      (table) => table.TABLE_ID.toString() !== tableId
    );

    await cart.save();
    return cart;
  }

  async updateFoodQuantity(userId, tableId, foodId, newQuantity) {
    let cart = await CART_MODEL.findOne({ USER_ID: userId });

    if (!cart) {
      throw new Error("Cart not found");
    }

    // Tìm bàn trong giỏ hàng
    let tableInCart = cart.LIST_TABLES.find(
      (table) => table.TABLE_ID.toString() === tableId
    );

    if (!tableInCart) {
      throw new Error("Table not found in cart");
    }

    // Tìm món ăn trong LIST_FOOD
    let foodInTable = tableInCart.LIST_FOOD.find(
      (food) => food.FOOD_ID.toString() === foodId
    );

    if (!foodInTable) {
      throw new Error("Food not found in table");
    }

    // Cập nhật số lượng món ăn
    foodInTable.QUANTITY = newQuantity;
    foodInTable.TOTAL_PRICE_FOOD =
      foodInTable.QUANTITY *
      (foodInTable.TOTAL_PRICE_FOOD / foodInTable.QUANTITY);

    await cart.save();
    return cart;
  }

  async updateTableInCart(userId, oldTableId, newTableId) {
    let cart = await CART_MODEL.findOne({ USER_ID: userId });

    if (!cart) {
      throw new Error("Cart not found");
    }

    // Tìm bàn hiện tại
    let tableInCart = cart.LIST_TABLES.find(
      (table) => table.TABLE_ID.toString() === oldTableId
    );

    if (!tableInCart) {
      throw new Error("Old table not found in cart");
    }

    // Thay thế tableId cũ bằng tableId mới
    tableInCart.TABLE_ID = newTableId;

    await cart.save();
    return cart;
  }

  async updateServiceInCart(userId, tableId, serviceName, newService) {
    let cart = await CART_MODEL.findOne({ USER_ID: userId });

    if (!cart) {
      throw new Error("Cart not found");
    }

    // Tìm bàn trong giỏ hàng
    let tableInCart = cart.LIST_TABLES.find(
      (table) => table.TABLE_ID.toString() === tableId
    );

    if (!tableInCart) {
      throw new Error("Table not found in cart");
    }

    // Tìm và thay đổi dịch vụ trong SERVICES
    let serviceInTable = tableInCart.SERVICES.find(
      (service) => service.serviceName === serviceName
    );

    if (!serviceInTable) {
      throw new Error("Service not found in table");
    }

    // Thay đổi thông tin dịch vụ
    serviceInTable.serviceName =
      newService.serviceName || serviceInTable.serviceName;
    serviceInTable.servicePrice =
      newService.servicePrice || serviceInTable.servicePrice;

    await cart.save();
    return cart;
  }
}

module.exports = new CART_SERVICE();
