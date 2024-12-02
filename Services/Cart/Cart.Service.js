const CART_MODEL = require("../../Models/Cart/Cart.Model");
const TABLE_MODEL = require("../../Models/Table/Table.Model");
const FOOD_MODEL = require("../../Models/Food/Food.Model");
const mongoose = require("mongoose");
const ServiceTable = require("../../Models/ServiceTable/ServiceTable.Model");
const moment = require("moment");

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

    const isTableInCart = cart.LIST_TABLES.some(
      (table) => table.TABLE_ID.toString() === tableId
    );

    if (isTableInCart) {
      throw new Error(
        "Bạn đã thêm bàn này vào giỏ hàng rồi vui lòng chọn bàn khác!"
      );
    }

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

    const listServiceItems = [];
    for (const serviceItem of services) {
      const serviceTable = await ServiceTable.findById(serviceItem._id);
      if (!serviceTable) {
        throw new Error(`ServiceTable with ID ${serviceItem._id} not found`);
      }
      listServiceItems.push({
        SERVICES_ID: serviceTable._id,
      });
    }

    cart.LIST_TABLES.push({
      TABLE_ID: tableId,
      BOOKING_TIME: bookingTime,
      SERVICES: listServiceItems,
      LIST_FOOD: listFoodItems,
    });

    const tablePrice = table.PRICE;

    const totalPrice = await this.totalPriceCart(cart.LIST_TABLES);

    cart.TOTAL_PRICES = totalPrice + tablePrice;
    await cart.save();

    return cart;
  }

  async removeFoodFromTable(userId, tableId, foodId) {
    let cart = await CART_MODEL.findOne({ USER_ID: userId });

    if (!cart) {
      throw new Error("Cart not found");
    }

    let tableInCart = cart.LIST_TABLES.find(
      (table) => table.TABLE_ID.toString() === tableId
    );

    if (!tableInCart) {
      throw new Error("Table not found in cart");
    }

    tableInCart.LIST_FOOD = tableInCart.LIST_FOOD.filter(
      (food) => food.FOOD_ID.toString() !== foodId
    );

    if (tableInCart.LIST_FOOD.length === 0) {
      cart.LIST_TABLES = cart.LIST_TABLES.filter(
        (table) => table.TABLE_ID.toString() !== tableId
      );
    }

    if (cart.LIST_TABLES.length === 0) {
      await CART_MODEL.deleteOne({ USER_ID: userId });
      return null;
    } else {
      await cart.save();
      return cart;
    }
  }

  async removeTableFromCart(userId, tableId, bookingTime) {
    let cart = await CART_MODEL.findOne({ USER_ID: userId });

    if (!cart) {
      throw new Error("Cart not found");
    }

    cart.LIST_TABLES = cart.LIST_TABLES.filter(
      (table) =>
        !(
          table.TABLE_ID.toString() === tableId &&
          table.BOOKING_TIME === bookingTime
        )
    );

    if (cart.LIST_TABLES.length === 0) {
      await CART_MODEL.deleteOne({ USER_ID: userId });
      return null;
    } else {
      await cart.save();
      return cart;
    }
  }

  async updateFoodQuantity(userId, tableId, foodId, newQuantity) {
    let cart = await CART_MODEL.findOne({ USER_ID: userId });

    if (!cart) {
      throw new Error("Cart not found");
    }

    let tableInCart = cart.LIST_TABLES.find(
      (table) => table.TABLE_ID.toString() === tableId
    );

    if (!tableInCart) {
      throw new Error("Table not found in cart");
    }

    let foodInTable = tableInCart.LIST_FOOD.find(
      (food) => food.FOOD_ID.toString() === foodId
    );

    if (!foodInTable) {
      throw new Error("Food not found in table");
    }

    const food = await FOOD_MODEL.findById(foodId);
    foodInTable.QUANTITY = newQuantity;
    foodInTable.TOTAL_PRICE_FOOD = foodInTable.QUANTITY * food.PRICE;

    if (newQuantity === 0) {
      tableInCart.LIST_FOOD = tableInCart.LIST_FOOD.filter(
        (food) => food.FOOD_ID.toString() !== foodId
      );

      if (tableInCart.LIST_FOOD.length === 0) {
        cart.LIST_TABLES = cart.LIST_TABLES.filter(
          (table) => table.TABLE_ID.toString() !== tableId
        );
      }

      if (cart.LIST_TABLES.length === 0) {
        await CART_MODEL.deleteOne({ USER_ID: userId });
        return null;
      }
    }

    await cart.save();
    return cart;
  }

  async updateTableInCart(userId, oldTableId, newTableId) {
    let cart = await CART_MODEL.findOne({ USER_ID: userId });

    if (!cart) {
      throw new Error("Cart not found");
    }

    let tableInCart = cart.LIST_TABLES.find(
      (table) => table.TABLE_ID.toString() === oldTableId
    );

    if (!tableInCart) {
      throw new Error("Old table not found in cart");
    }

    tableInCart.TABLE_ID = newTableId;

    await cart.save();
    return cart;
  }
  async totalPriceCart(listTables) {
    return listTables.reduce((total, table) => {
      const foodTotalPrice = table.TOTAL_PRICE_FOOD || 0;
      const serviceTotalPrice = table.TOTAL_SERVICE_PRICE || 0;

      const tableTotal = foodTotalPrice + serviceTotalPrice;

      return total + tableTotal;
    }, 0);
  }
  async getCartByUserId(userId) {
    const cartAggregation = await CART_MODEL.aggregate([
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
        $lookup: {
          from: "servicetables",
          localField: "LIST_TABLES.SERVICES.SERVICES_ID",
          foreignField: "_id",
          as: "serviceDetails",
        },
      },
      {
        $addFields: {
          "LIST_TABLES.SERVICES": {
            $map: {
              input: "$LIST_TABLES.SERVICES",
              as: "service",
              in: {
                $let: {
                  vars: {
                    serviceObj: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$serviceDetails",
                            as: "serviceDetail",
                            cond: {
                              $eq: [
                                "$$serviceDetail._id",
                                "$$service.SERVICES_ID",
                              ],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: "$$serviceObj",
                },
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
                    { $ifNull: ["$$food.foodPrice.PRICE", 0] },
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

    let cartData = cartAggregation[0];

    if (!cartData) {
      cartData = {
        USER_ID: userId,
        LIST_TABLES: [],
        TOTAL_PRICES: 0,
      };
    } else {
      cartData.LIST_TABLES = cartData.LIST_TABLES || [];

      cartData.TOTAL_PRICES = await this.totalPriceCart(cartData.LIST_TABLES);
    }

    return cartData;
  }

  mergeTables(listTables) {
    const tables = listTables || [];
    const mergedTables = [];

    tables.forEach((table) => {
      const existingTable = mergedTables.find(
        (t) => t.TABLE_ID.toString() === table.TABLE_ID.toString()
      );

      if (existingTable) {
        existingTable.LIST_FOOD = [
          ...existingTable.LIST_FOOD,
          ...table.LIST_FOOD,
        ];
        existingTable.SERVICES = [...existingTable.SERVICES, ...table.SERVICES];
        existingTable.TOTAL_PRICE_FOOD += table.TOTAL_PRICE_FOOD || 0;
        existingTable.TOTAL_SERVICE_PRICE += table.TOTAL_SERVICE_PRICE || 0;
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
        const food = await FOOD_MODEL.findById(foodItem.FOOD_ID);
        foodInTable.QUANTITY += foodItem.QUANTITY;
        foodInTable.TOTAL_PRICE_FOOD = foodInTable.QUANTITY * food.PRICE;
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
    const food = await FOOD_MODEL.findById(foodId);
    foodInTable.QUANTITY = newQuantity;
    foodInTable.TOTAL_PRICE_FOOD = foodInTable.QUANTITY * food.PRICE;

    // Nếu số lượng mới là 0, xóa món ăn khỏi LIST_FOOD
    if (newQuantity === 0) {
      tableInCart.LIST_FOOD = tableInCart.LIST_FOOD.filter(
        (food) => food.FOOD_ID.toString() !== foodId
      );

      // Kiểm tra nếu LIST_FOOD trống sau khi xóa
      if (tableInCart.LIST_FOOD.length === 0) {
        // Xóa bàn khỏi LIST_TABLES
        cart.LIST_TABLES = cart.LIST_TABLES.filter(
          (table) => table.TABLE_ID.toString() !== tableId
        );
      }

      // Kiểm tra nếu LIST_TABLES trống sau khi xóa bàn
      if (cart.LIST_TABLES.length === 0) {
        // Xóa cart khỏi cơ sở dữ liệu
        await CART_MODEL.deleteOne({ USER_ID: userId });
        return null; // Trả về null hoặc thông báo phù hợp
      }
    }

    await cart.save();
    return cart;
  }

  async updateServicesInCart(userId, tableId, selectedServiceIds) {
    // Tìm giỏ hàng của người dùng
    let cart = await CART_MODEL.findOne({ USER_ID: userId });

    if (!cart) {
      cart = await this.createCart(userId);
    }

    // Tìm bàn trong giỏ hàng
    let tableInCart = cart.LIST_TABLES.find(
      (table) => table.TABLE_ID.toString() === tableId
    );

    if (!tableInCart) {
      throw new Error("Table not found in cart. Please add the table first.");
    }

    // Lấy thông tin bàn từ Table Model
    const table = await TABLE_MODEL.findById(tableId);
    if (!table) {
      throw new Error("Table not found in the system.");
    }

    // Kiểm tra danh sách dịch vụ từ ServiceTable Model
    const servicesToAdd = await ServiceTable.find({
      _id: { $in: selectedServiceIds }, // Lấy các dịch vụ theo ID đã chọn
      type: table.TYPE, // Đảm bảo loại dịch vụ khớp với loại bàn
    });

    // Log dịch vụ để kiểm tra

    // Xóa các dịch vụ cũ không còn trong selectedServiceIds
    tableInCart.SERVICES = tableInCart.SERVICES.filter((service) =>
      selectedServiceIds.includes(service.SERVICES_ID.toString())
    );

    // Nếu không có dịch vụ nào để thêm
    if (servicesToAdd.length === 0) {
      // Nếu không có dịch vụ nào được chọn, xóa tất cả dịch vụ
      if (selectedServiceIds.length === 0) {
        tableInCart.SERVICES = []; // Xóa tất cả dịch vụ
      } else {
        throw new Error("No valid services selected.");
      }
    } else {
      // Thêm dịch vụ mới vào giỏ hàng
      for (const newService of servicesToAdd) {
        const isServiceExist = tableInCart.SERVICES.some(
          (service) =>
            service.SERVICES_ID.toString() === newService._id.toString()
        );

        if (!isServiceExist) {
          tableInCart.SERVICES.push({ SERVICES_ID: newService._id });
        }
      }
    }

    // Lưu giỏ hàng sau khi cập nhật
    await cart.save();
    return cart;
  }

  async updateBookingTime(userId, tableId, newBookingTime) {
    try {
      const table = await TABLE_MODEL.findById(tableId);
      if (!table) {
        throw new Error("Table not found");
      }
      // Kiểm tra sự tồn tại của giỏ hàng
      const cart = await CART_MODEL.findOne({ USER_ID: userId });
      if (!cart) {
        throw new Error("Cart not found for this user");
      }

      // Kiểm tra sự tồn tại của TABLE_ID trong LIST_TABLES
      const tableInCart = cart.LIST_TABLES.find(
        (tableItem) => tableItem.TABLE_ID.toString() === tableId
      );
      if (!tableInCart) {
        throw new Error("Table not found in the cart");
      }

      // Kiểm tra chênh lệch thời gian với các BOOKING_TIMES đã tồn tại
      const newTime = new Date(newBookingTime);

      for (let booking of table.BOOKING_TIMES) {
        const existingTime = new Date(booking.START_TIME);
        const timeDifference = Math.abs(newTime - existingTime) / 36e5; // Chênh lệch thời gian tính bằng giờ

        if (timeDifference < 3) {
          throw new Error(
            "Booking time must have at least 3 hours difference from existing bookings"
          );
        }
      }

      // Nếu kiểm tra hợp lệ, cập nhật booking time cho cart
      tableInCart.BOOKING_TIME = newBookingTime;
      await cart.save();

      return cart;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async checkAndRemoveInvalidTables(userId) {
    try {
      // Lấy giỏ hàng của người dùng
      const cart = await CART_MODEL.findOne({ USER_ID: userId });

      if (!cart) {
        throw new Error("Cart not found.");
      }

      const listTables = cart.LIST_TABLES;
      const validTables = [];

      for (const table of listTables) {
        const tableInDb = await TABLE_MODEL.findById(table.TABLE_ID);
        if (!tableInDb) {
          continue; // Nếu bàn không tồn tại trong DB, bỏ qua
        }

        // Kiểm tra tính hợp lệ của thời gian đặt bàn
        const bookingTime = table.BOOKING_TIME;
        const isValid = await this.checkBookingTimeValidity(
          bookingTime,
          tableInDb.BOOKING_TIMES
        );

        if (isValid) {
          validTables.push(table); // Nếu thời gian hợp lệ, thêm vào danh sách bàn hợp lệ
        }
      }

      // Cập nhật lại giỏ hàng với các bàn hợp lệ
      cart.LIST_TABLES = validTables;
      await cart.save();
    } catch (error) {
      throw new Error(
        `Error checking and removing invalid tables: ${error.message}`
      );
    }
  }

  // Kiểm tra tính hợp lệ của thời gian đặt bàn
  async checkBookingTimeValidity(bookingTime, bookingTimes) {
    try {
      const bookingTimeMoment = moment(bookingTime, "YYYY-MM-DD HH:mm"); // Chuyển đổi thời gian đặt thành moment object

      for (const existingBooking of bookingTimes) {
        const existingBookingTimeMoment = moment(
          existingBooking.START_TIME,
          "YYYY-MM-DD HH:mm"
        );

        // So sánh xem thời gian có trùng không
        if (bookingTimeMoment.isSame(existingBookingTimeMoment)) {
          return false; // Trùng giờ, không hợp lệ
        }

        // Kiểm tra chênh lệch thời gian so với thời gian đã đặt (chênh lệch quá 3 tiếng)
        const timeDifference = bookingTimeMoment.diff(
          existingBookingTimeMoment,
          "hours"
        );
        if (Math.abs(timeDifference) <= 3) {
          return false; // Chênh lệch không hợp lệ, cần ít nhất 3 giờ
        }
      }

      return true; // Nếu không có sự trùng lặp hoặc chênh lệch không hợp lệ
    } catch (error) {
      throw new Error(`Error checking booking time validity: ${error.message}`);
    }
  }
}

module.exports = new CART_SERVICE();
