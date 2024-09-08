const cartService = require("../../Services/Cart/Cart.Service");

const cartController = {
  async createCart(req, res) {
    try {
      const userId = req.user_id;
      console.log(userId);

      const cartData = req.body;
      const newCart = await cartService.createCart(cartData, userId);
      return res.status(201).json({
        success: true,
        data: newCart,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  // async createCart(req, res) {
  //   try {
  //     const userId = req.user_id;
  //     console.log(userId);
  //     const cart = await cartService.createCart(userId);

  //     return res.status(201).json({
  //       success: true,
  //       data: cart,
  //     });
  //   } catch (error) {
  //     console.error("Error creating cart:", error.message);
  //     return res.status(500).json({
  //       success: false,
  //       message: "Error creating cart.",
  //       error: error.message,
  //     });
  //   }
  // },

  async updateCart(req, res) {
    try {
      const { cartId } = req.params;
      const updatedData = req.body;
      const updatedCart = await cartService.updateCart(cartId, updatedData);
      if (!updatedCart) {
        return res.status(404).json({ message: "Cart not found" });
      }
      return res.status(200).json(updatedCart);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async addFoodToCart(req, res) {
    try {
      const { cartId } = req.params;
      const foodItem = req.body;
      const updatedCart = await cartService.addFoodToCart(cartId, foodItem);
      if (!updatedCart) {
        return res.status(404).json({ message: "Cart not found" });
      }
      return res.status(200).json(updatedCart);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async removeFoodFromCart(req, res) {
    try {
      const { cartId, foodId } = req.params;
      const updatedCart = await cartService.removeFoodFromCart(cartId, foodId);
      if (!updatedCart) {
        return res.status(404).json({ message: "Cart not found" });
      }
      return res.status(200).json(updatedCart);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async getCart(req, res) {
    try {
      const { cartId } = req.params;
      const cart = await cartService.getCart(cartId);
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }
      return res.status(200).json(cart);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async getCartByUserId(req, res) {
    try {
      const userId = req.user_id;
      console.log(userId);
      const cart = await cartService.getCartByUserId(userId);

      return res.status(200).json({
        success: true,
        message: "Cart retrieved successfully",
        cart: cart,
      });
    } catch (error) {
      console.error("Error in getCartByUserIdController:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve cart",
        error: error.message,
      });
    }
  },
};

module.exports = cartController;
