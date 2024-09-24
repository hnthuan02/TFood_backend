const CART_MODEL = require("../../Models/Cart/Cart.Model");
const TABLE_MODEL = require("../../Models/Table/Table.Model");
const FOOD_MODEL = require("../../Models/Food/Food.Model");
const mongoose = require("mongoose");

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

  calculateTotalPrices(listTables) {
    return listTables.reduce((total, table) => {
      // Tính tổng giá của tất cả các món ăn trong bàn
      const totalPriceFood = table.LIST_FOOD.reduce(
        (sum, food) => sum + food.QUANTITY * (food.foodPrice?.PRICE || 0),
        0
      );

      // Cập nhật lại giá trị `TOTAL_PRICE_FOOD` trong table nếu chưa có
      table.TOTAL_PRICE_FOOD = totalPriceFood;

      // Tính tổng giá dịch vụ trong bàn
      const totalPriceServices = table.SERVICES.reduce(
        (sum, service) => sum + (service.servicePrice || 0),
        0
      );

      // Lấy giá của bàn
      const tablePrice = table.TABLE_PRICE || 0;

      // Tính tổng giá của bàn hiện tại
      const totalTablePrice = totalPriceFood + totalPriceServices + tablePrice;

      // Cộng vào tổng giá trị của toàn bộ giỏ hàng
      return total + totalTablePrice;
    }, 0);
  }

  mergeTables(listTables) {
    const mergedTables = {};

    listTables.forEach((table) => {
      const tableId = table.TABLE_ID.toString();

      if (!mergedTables[tableId]) {
        mergedTables[tableId] = {
          ...table,
          SERVICES: [...table.SERVICES],
          LIST_FOOD: [...table.LIST_FOOD],
        };
      } else {
        // Gộp dịch vụ
        table.SERVICES.forEach((service) => {
          const existingService = mergedTables[tableId].SERVICES.find(
            (s) => s.serviceName === service.serviceName
          );
          if (!existingService) {
            mergedTables[tableId].SERVICES.push(service);
          }
        });

        // Gộp món ăn
        table.LIST_FOOD.forEach((food) => {
          const existingFood = mergedTables[tableId].LIST_FOOD.find(
            (f) => f.FOOD_ID.toString() === food.FOOD_ID.toString()
          );
          if (existingFood) {
            existingFood.QUANTITY += food.QUANTITY;
          } else {
            mergedTables[tableId].LIST_FOOD.push(food);
          }
        });
      }
    });

    return Object.values(mergedTables);
  }

  async getCartByUserId(userId) {
    const cart = await CART_MODEL.aggregate([
      {
        $match: { USER_ID: new mongoose.Types.ObjectId(userId) },
      },
      {
        $unwind: { path: "$LIST_TABLES", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "tables",
          localField: "LIST_TABLES.TABLE_ID",
          foreignField: "_id",
          as: "tableDetails",
        },
      },
      {
        $unwind: { path: "$tableDetails", preserveNullAndEmptyArrays: true },
      },
      // Loại bỏ AVAILABILITY từ tableDetails
      {
        $addFields: {
          tableDetails: {
            _id: "$tableDetails._id",
            TYPE: "$tableDetails.TYPE",
            PRICE: "$tableDetails.PRICE",
            DESCRIPTION: "$tableDetails.DESCRIPTION",
            IMAGES: "$tableDetails.IMAGES",
            CAPACITY: "$tableDetails.CAPACITY",
            IS_DELETED: "$tableDetails.IS_DELETED",
            SERVICES: "$tableDetails.SERVICES",
            TABLE_NUMBER: "$tableDetails.TABLE_NUMBER",
            DEPOSIT: "$tableDetails.DEPOSIT",
            // Không bao gồm AVAILABILITY
          },
        },
      },
      {
        $lookup: {
          from: "foods",
          localField: "LIST_TABLES.LIST_FOOD.FOOD_ID",
          foreignField: "_id",
          as: "foodDetails",
        },
      },
      {
        $addFields: {
          "LIST_TABLES.LIST_FOOD": {
            $map: {
              input: "$LIST_TABLES.LIST_FOOD",
              as: "foodItem",
              in: {
                $mergeObjects: [
                  "$$foodItem",
                  {
                    foodPrice: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$foodDetails",
                            as: "foodDetail",
                            cond: {
                              $eq: ["$$foodDetail._id", "$$foodItem.FOOD_ID"],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          "LIST_TABLES.TOTAL_PRICE_FOOD": {
            $sum: {
              $map: {
                input: "$LIST_TABLES.LIST_FOOD",
                as: "food",
                in: {
                  $multiply: [
                    "$$food.QUANTITY",
                    { $ifNull: ["$$food.foodPrice.PRICE", 0] }, // Đảm bảo dùng đúng giá của từng món ăn
                  ],
                },
              },
            },
          },
          "LIST_TABLES.TABLE_PRICE": "$tableDetails.PRICE",
          "LIST_TABLES.TOTAL_SERVICE_PRICE": {
            $sum: {
              $map: {
                input: "$LIST_TABLES.SERVICES",
                as: "service",
                in: { $ifNull: ["$$service.servicePrice", 0] },
              },
            },
          },
          // Gộp tableInfo với các trường cần thiết
          "LIST_TABLES.tableInfo": {
            $mergeObjects: [
              {
                _id: "$tableDetails._id",
                TYPE: "$tableDetails.TYPE",
                PRICE: "$tableDetails.PRICE",
                DESCRIPTION: "$tableDetails.DESCRIPTION",
                IMAGES: "$tableDetails.IMAGES",
                CAPACITY: "$tableDetails.CAPACITY",
                IS_DELETED: "$tableDetails.IS_DELETED",
                SERVICES: "$tableDetails.SERVICES",
                TABLE_NUMBER: "$tableDetails.TABLE_NUMBER",
                DEPOSIT: "$tableDetails.DEPOSIT",
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          USER_ID: { $first: "$USER_ID" },
          LIST_TABLES: { $push: "$LIST_TABLES" },
        },
      },
      {
        $project: {
          _id: 0,
          USER_ID: 1,
          LIST_TABLES: 1,
        },
      },
    ]);

    if (!cart || cart.length === 0) {
      throw new Error("Cart not found");
    }

    // Gộp các bàn lại nếu có cùng TABLE_ID
    cart[0].LIST_TABLES = this.mergeTables(cart[0].LIST_TABLES);

    // Tính tổng giá tiền bao gồm tất cả các bàn
    cart[0].TOTAL_PRICES = this.calculateTotalPrices(cart[0].LIST_TABLES);

    return cart[0];
  }

  // Hàm gộp các bàn cùng TABLE_ID
  mergeTables(listTables) {
    const mergedTables = [];

    listTables.forEach((table) => {
      const existingTable = mergedTables.find(
        (t) => t.TABLE_ID.toString() === table.TABLE_ID.toString()
      );

      if (existingTable) {
        existingTable.LIST_FOOD = [
          ...existingTable.LIST_FOOD,
          ...table.LIST_FOOD,
        ];
        existingTable.SERVICES = [...existingTable.SERVICES, ...table.SERVICES];
        existingTable.TOTAL_PRICE_FOOD += table.TOTAL_PRICE_FOOD;
        existingTable.TOTAL_SERVICE_PRICE += table.TOTAL_SERVICE_PRICE;
      } else {
        mergedTables.push(table);
      }
    });

    return mergedTables;
  }

  async addFoodToTable(userId, tableId, listFood) {
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

    // Duyệt qua từng món ăn trong danh sách
    for (const foodItem of listFood) {
      const foodInTable = tableInCart.LIST_FOOD.find(
        (food) => food.FOOD_ID.toString() === foodItem.FOOD_ID
      );

      if (foodInTable) {
        // Nếu món ăn đã tồn tại, cập nhật số lượng
        foodInTable.QUANTITY += foodItem.QUANTITY;
        foodInTable.TOTAL_PRICE_FOOD =
          foodInTable.QUANTITY *
          (foodInTable.TOTAL_PRICE_FOOD / foodInTable.QUANTITY);
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

    await cart.save();
    return cart;
  }

  async updateFoodInTable(userId, tableId, foodId, newQuantity) {
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

    // Tìm món ăn trong bàn
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
}

module.exports = new CART_SERVICE();
