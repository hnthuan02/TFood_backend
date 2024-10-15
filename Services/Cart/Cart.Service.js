const CART_MODEL = require("../../Models/Cart/Cart.Model");
const TABLE_MODEL = require("../../Models/Table/Table.Model");
const FOOD_MODEL = require("../../Models/Food/Food.Model");
const mongoose = require("mongoose");
const ServiceTable = require("../../Models/ServiceTable/ServiceTable.Model");

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
      // Nếu bàn đã có trong giỏ hàng, nhưng có thể có nhiều BOOKING_TIME khác nhau
      if (tableInCart.BOOKING_TIME === bookingTime) {
        // Nếu thời gian đặt giống nhau, không thêm nữa
        throw new Error(
          "This table has already been booked for the selected time."
        );
      }

      // Nếu thời gian khác nhau, thêm bàn mới
      const newTableEntry = {
        TABLE_ID: tableId,
        BOOKING_TIME: bookingTime,
        SERVICES: services,
        LIST_FOOD: listFood,
      };

      cart.LIST_TABLES.push(newTableEntry);
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

      const listServiceItems = []; // Sửa lại biến để lưu dịch vụ
      for (const serviceItem of services) {
        const serviceTable = await ServiceTable.findById(serviceItem._id);
        if (!serviceTable) {
          throw new Error(`ServiceTable with ID ${serviceItem._id} not found`);
        }
        // Lưu đúng ID của dịch vụ
        listServiceItems.push({
          SERVICES_ID: serviceTable._id,
        });
      }

      // Thêm bàn mới vào LIST_TABLES
      cart.LIST_TABLES.push({
        TABLE_ID: tableId,
        BOOKING_TIME: bookingTime,
        SERVICES: listServiceItems, // Sử dụng danh sách dịch vụ đã cập nhật
        LIST_FOOD: listFoodItems,
      });
    }

    // Lấy giá của bàn từ mô hình Table
    const table = await TABLE_MODEL.findById(tableId);
    if (!table) {
      throw new Error("Table not found");
    }
    tablePrice = table.PRICE;

    // Cập nhật tổng giá tiền bao gồm giá bàn, món ăn và dịch vụ
    const totalPrice = await this.totalPriceCart(cart.LIST_TABLES);

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

    // Kiểm tra nếu LIST_FOOD trống sau khi xóa
    if (tableInCart.LIST_FOOD.length === 0) {
      // Xóa bàn khỏi LIST_TABLES
      cart.LIST_TABLES = cart.LIST_TABLES.filter(
        (table) => table.TABLE_ID.toString() !== tableId
      );
    }

    // **Kiểm tra nếu LIST_TABLES trống sau khi xóa bàn**
    if (cart.LIST_TABLES.length === 0) {
      // Xóa cart khỏi cơ sở dữ liệu
      await CART_MODEL.deleteOne({ USER_ID: userId });
      return null; // Trả về null hoặc thông báo phù hợp
    } else {
      await cart.save();
      return cart;
    }
  }

  async removeTableFromCart(userId, tableId, bookingTime) {
    // Tìm giỏ hàng của người dùng
    let cart = await CART_MODEL.findOne({ USER_ID: userId });

    if (!cart) {
      throw new Error("Cart not found");
    }

    // Lọc bỏ bàn có TABLE_ID bằng với tableId
    cart.LIST_TABLES = cart.LIST_TABLES.filter(
      (table) =>
        !(
          table.TABLE_ID.toString() === tableId &&
          table.BOOKING_TIME === bookingTime
        )
    );

    // **Kiểm tra nếu LIST_TABLES trống sau khi xóa bàn**
    if (cart.LIST_TABLES.length === 0) {
      // Xóa cart khỏi cơ sở dữ liệu
      await CART_MODEL.deleteOne({ USER_ID: userId });
      return null; // Trả về null hoặc thông báo phù hợp
    } else {
      // Lưu lại giỏ hàng sau khi cập nhật
      await cart.save();
      return cart;
    }
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

  // calculateTotalPrices(listTables) {
  //   const tables = listTables || [];
  //   return tables.reduce((total, table) => {
  //     const totalPriceFood = (table.LIST_FOOD || []).reduce(
  //       (sum, food) => sum + food.LIST_FOOD,
  //       0
  //     );

  //     // Tính tổng giá dịch vụ trong bàn
  //     const totalPriceServices = (table.SERVICES || []).reduce(
  //       (sum, service) => sum + (service.servicePrice || 0),
  //       0
  //     );

  //     // Lấy giá của bàn từ tableInfo nếu có
  //     const tablePrice = table.tableInfo ? table.tableInfo.PRICE : 0;

  //     // Tính tổng giá của bàn hiện tại
  //     const totalTablePrice = totalPriceFood + totalPriceServices + tablePrice;

  //     // Cộng vào tổng giá trị của toàn bộ giỏ hàng
  //     return total + totalTablePrice;
  //   }, 0);
  // }
  async totalPriceCart(listTables) {
    // Tính tổng giá trị của giỏ hàng dựa trên các bàn
    return listTables.reduce((total, table) => {
      const foodTotalPrice = table.TOTAL_PRICE_FOOD || 0; // Tổng giá món ăn
      const serviceTotalPrice = table.TOTAL_SERVICE_PRICE || 0; // Tổng giá dịch vụ

      // Tổng giá trị của bàn này
      const tableTotal = foodTotalPrice + serviceTotalPrice;

      // Cộng tổng giá của bàn này vào tổng giá của toàn bộ giỏ hàng
      return total + tableTotal;
    }, 0); // Giá khởi điểm là 0
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
          from: "servicetables", // Tên collection chứa dịch vụ
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
          _id: "$_id", // Giữ nguyên thông tin bàn
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
      // Nếu không tìm thấy giỏ hàng, trả về giỏ hàng trống
      cartData = {
        USER_ID: userId,
        LIST_TABLES: [],
        TOTAL_PRICES: 0,
      };
    } else {
      // Không cần gộp lại bàn, vì đã lấy tất cả các bàn
      cartData.LIST_TABLES = cartData.LIST_TABLES || [];

      // Tính tổng giá tiền bao gồm tất cả các bàn
      cartData.TOTAL_PRICES = await this.totalPriceCart(cartData.LIST_TABLES);
    }

    return cartData;
  }

  // async getCartByUserId(userId) {
  //   const cartAggregation = await CART_MODEL.aggregate([
  //     {
  //       $match: { USER_ID: new mongoose.Types.ObjectId(userId) },
  //     },
  //     {
  //       $unwind: { path: "$LIST_TABLES", preserveNullAndEmptyArrays: true },
  //     },
  //     {
  //       $lookup: {
  //         from: "tables",
  //         localField: "LIST_TABLES.TABLE_ID",
  //         foreignField: "_id",
  //         as: "tableDetails",
  //       },
  //     },
  //     {
  //       $unwind: { path: "$tableDetails", preserveNullAndEmptyArrays: true },
  //     },
  //     // Loại bỏ AVAILABILITY từ tableDetails
  //     {
  //       $addFields: {
  //         tableDetails: {
  //           _id: "$tableDetails._id",
  //           TYPE: "$tableDetails.TYPE",
  //           PRICE: "$tableDetails.PRICE",
  //           DESCRIPTION: "$tableDetails.DESCRIPTION",
  //           IMAGES: "$tableDetails.IMAGES",
  //           CAPACITY: "$tableDetails.CAPACITY",
  //           IS_DELETED: "$tableDetails.IS_DELETED",
  //           SERVICES: "$tableDetails.SERVICES",
  //           TABLE_NUMBER: "$tableDetails.TABLE_NUMBER",
  //           DEPOSIT: "$tableDetails.DEPOSIT",
  //           // Không bao gồm AVAILABILITY
  //         },
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "foods",
  //         localField: "LIST_TABLES.LIST_FOOD.FOOD_ID",
  //         foreignField: "_id",
  //         as: "foodDetails",
  //       },
  //     },
  //     {
  //       $addFields: {
  //         "LIST_TABLES.LIST_FOOD": {
  //           $map: {
  //             input: "$LIST_TABLES.LIST_FOOD",
  //             as: "foodItem",
  //             in: {
  //               $mergeObjects: [
  //                 "$$foodItem",
  //                 {
  //                   foodPrice: {
  //                     $arrayElemAt: [
  //                       {
  //                         $filter: {
  //                           input: "$foodDetails",
  //                           as: "foodDetail",
  //                           cond: {
  //                             $eq: ["$$foodDetail._id", "$$foodItem.FOOD_ID"],
  //                           },
  //                         },
  //                       },
  //                       0,
  //                     ],
  //                   },
  //                 },
  //               ],
  //             },
  //           },
  //         },
  //       },
  //     },
  //     {
  //       $addFields: {
  //         "LIST_TABLES.TOTAL_PRICE_FOOD": {
  //           $sum: {
  //             $map: {
  //               input: "$LIST_TABLES.LIST_FOOD",
  //               as: "food",
  //               in: {
  //                 $multiply: [
  //                   "$$food.QUANTITY",
  //                   { $ifNull: ["$$food.foodPrice.PRICE", 0] },
  //                 ],
  //               },
  //             },
  //           },
  //         },
  //         "LIST_TABLES.TABLE_PRICE": "$tableDetails.PRICE",
  //         "LIST_TABLES.TOTAL_SERVICE_PRICE": {
  //           $sum: {
  //             $map: {
  //               input: "$LIST_TABLES.SERVICES",
  //               as: "service",
  //               in: { $ifNull: ["$$service.servicePrice", 0] },
  //             },
  //           },
  //         },
  //         "LIST_TABLES.tableInfo": {
  //           $mergeObjects: [
  //             {
  //               _id: "$tableDetails._id",
  //               TYPE: "$tableDetails.TYPE",
  //               PRICE: "$tableDetails.PRICE",
  //               DESCRIPTION: "$tableDetails.DESCRIPTION",
  //               IMAGES: "$tableDetails.IMAGES",
  //               CAPACITY: "$tableDetails.CAPACITY",
  //               IS_DELETED: "$tableDetails.IS_DELETED",
  //               SERVICES: "$tableDetails.SERVICES",
  //               TABLE_NUMBER: "$tableDetails.TABLE_NUMBER",
  //               DEPOSIT: "$tableDetails.DEPOSIT",
  //             },
  //           ],
  //         },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: "$_id",
  //         USER_ID: { $first: "$USER_ID" },
  //         LIST_TABLES: { $push: "$LIST_TABLES" },
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         USER_ID: 1,
  //         LIST_TABLES: 1,
  //       },
  //     },
  //   ]);

  //   let cartData = cartAggregation[0];

  //   if (!cartData) {
  //     // Nếu không tìm thấy giỏ hàng, trả về giỏ hàng trống
  //     cartData = {
  //       USER_ID: userId,
  //       LIST_TABLES: [],
  //       TOTAL_PRICES: 0,
  //     };
  //   } else {
  //     // Gộp các bàn lại nếu có cùng TABLE_ID
  //     cartData.LIST_TABLES = this.mergeTables(cartData.LIST_TABLES || []);

  //     // Tính tổng giá tiền bao gồm tất cả các bàn
  //     // cartData.TOTAL_PRICES = this.calculateTotalPrices(cartData.LIST_TABLES);
  //     cartData.TOTAL_PRICES = this.totalPriceCart(cartData.LIST_TABLES);
  //   }

  //   return cartData;
  // }

  // Hàm gộp các bàn cùng TABLE_ID
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
}

module.exports = new CART_SERVICE();
