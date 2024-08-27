const express = require("express");
const router = express.Router();
const USER_CONTROLLER = require("../../Controllers/User/User.Controller");
const {
  verifyToken,
  verifyTokenAdmin,
} = require("../../Middleware/verifyToken");
const authorizeRoles = require("../../Middleware/authorizeRoles");

router.post("/registerUser", USER_CONTROLLER.registerUser);
router.post("/verifyUserByOTP", USER_CONTROLLER.verifyUserByOTP);
router.post("/forgotPassword", USER_CONTROLLER.forgotPassword);
router.post("/resendOTP", USER_CONTROLLER.ResendOTP);
router.post("/resetPassword", USER_CONTROLLER.resetPassword);
router.post("/loginUser", USER_CONTROLLER.login);
router.put("/editUser", verifyToken, USER_CONTROLLER.editUser);
router.post("/logout", USER_CONTROLLER.logout);
router.get(
  "/getAllUsers",
  verifyToken,
  authorizeRoles("ADMIN", "BRANCH_MANAGER", "STAFF"),
  USER_CONTROLLER.getUsers
);
router.post(
  "/blockUser",
  verifyToken,
  authorizeRoles("ADMIN", "BRANCH_MANAGER"),
  USER_CONTROLLER.blockUser
);

module.exports = router;
