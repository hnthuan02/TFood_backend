const Cart = require("../../Models/Cart/Cart.Model");
const Food = require("../../Models/Food/Food.Model"); // Import model món ăn

const cartService = {
  async calculateTotalPrice(cart) {
    try {
      let totalPrice = 0;

      for (const foodItem of cart.LIST_FOOD) {
        const food = await Food.findById(foodItem.FOOD_ID).lean(); // Lấy thông tin món ăn
        if (food) {
          totalPrice += food.PRICE * foodItem.QUANTITY; // Tính tổng giá
        }
      }

      return totalPrice;
    } catch (error) {
      throw new Error("Error calculating total price: " + error.message);
    }
  },

  async createCart(cartData, userId) {
    try {
      const totalPrice = await this.calculateTotalPrice(cartData);
      cartData.TOTAL_PRICES = totalPrice;
      const newCart = new Cart({
        USER_ID: userId,
        LIST_FOOD: cartData.LIST_FOOD || [],
        QUANTITY: 0,
        TOTAL_PRICES: totalPrice,
      });
      return await newCart.save();
    } catch (error) {
      throw new Error("Error creating cart: " + error.message);
    }
  },
  // async createCart(userId) {
  //   const newCart = new Cart({
  //     USER_ID: userId,
  //     LIST_FOOD: [],
  //     QUANTITY: 0,
  //     TOTAL_PRICES: 0,
  //   });

  //   await newCart.save();
  //   return newCart;
  // },

  async updateCart(cartId, updatedData) {
    try {
      const totalPrice = await this.calculateTotalPrice(updatedData);
      updatedData.TOTAL_PRICES = totalPrice;
      return await Cart.findByIdAndUpdate(cartId, updatedData, { new: true });
    } catch (error) {
      throw new Error("Error updating cart: " + error.message);
    }
  },

  async addFoodToCart(cartId, foodItem) {
    try {
      const cart = await Cart.findByIdAndUpdate(
        cartId,
        { $push: { LIST_FOOD: foodItem } },
        { new: true }
      );

      if (!cart) throw new Error("Cart not found");

      const totalPrice = await this.calculateTotalPrice(cart);
      cart.TOTAL_PRICES = totalPrice;
      return await cart.save();
    } catch (error) {
      throw new Error("Error adding food to cart: " + error.message);
    }
  },

  async removeFoodFromCart(cartId, foodId) {
    try {
      const cart = await Cart.findByIdAndUpdate(
        cartId,
        { $pull: { LIST_FOOD: { FOOD_ID: foodId } } },
        { new: true }
      );

      if (!cart) throw new Error("Cart not found");

      const totalPrice = await this.calculateTotalPrice(cart);
      cart.TOTAL_PRICES = totalPrice;
      return await cart.save();
    } catch (error) {
      throw new Error("Error removing food from cart: " + error.message);
    }
  },

  async getCart(cartId) {
    try {
      const cart = await Cart.findById(cartId).lean();

      if (!cart) {
        throw new Error("Cart not found");
      }

      // Duyệt qua từng món ăn trong giỏ và lấy thông tin chi tiết của món
      const detailedFoods = await Promise.all(
        cart.LIST_FOOD.map(async (foodItem) => {
          const food = await Food.findById(foodItem.FOOD_ID).lean();
          if (food) {
            return {
              ...foodItem,
              foodDetails: food, // Gắn thông tin chi tiết món ăn
            };
          } else {
            return foodItem; // Trả về nếu món ăn không còn tồn tại
          }
        })
      );

      return {
        ...cart,
        LIST_FOOD: detailedFoods, // Thay thế LIST_FOOD với thông tin chi tiết của món
      };
    } catch (error) {
      throw new Error("Error getting cart details: " + error.message);
    }
  },

  async getCartByUserId(userId) {
    const cart = await Cart.findOne({ USER_ID: userId })

      .populate({
        path: "LIST_FOOD.FOOD_ID",
        select: "NAME",
      })
      .lean();

    // .populate({
    //   path: "LIST_FOOD.QUANTITY",
    //   select: "TYPE PRICE_PERNIGHT",
    // })

    if (!cart) {
      throw new Error("Cart not found");
    }

    return cart;
  },
};

module.exports = cartService;
