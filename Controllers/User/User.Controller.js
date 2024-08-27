const USER_MODEL = require("../../Models/User/User.Model");
const USER_SERVICE = require("../../Services/User/User.Service");
const USER_VALIDATES = require("../../Models/User/validate/validateUser");
const USER_EDIT_VALIDATES = require("../../Models/User/validate/editUser");
const COOKIE_OPTIONS = require("../../Config/cookieOptions");
const MailQueue = require("../../Utils/sendMail");
const User = require("../../Models/User/User.Model");
class USER_CONTROLLER {
  registerUser = async (req, res) => {
    const payload = req.body;
    const otpType = "create_account";
    const { error, value } = USER_VALIDATES.registerValidate.validate(payload);
    if (error) {
      const errors = error.details.reduce((acc, current) => {
        acc[current.context.key] = current.message;
        return acc;
      }, {});
      return res.status(400).json({ errors });
    }

    const { EMAIL, PHONE_NUMBER } = value;

    try {
      // Kiểm tra xem người dùng đã tồn tại chưa
      const checkUserExists = await USER_SERVICE.checkUserExists(
        EMAIL,
        PHONE_NUMBER
      );
      if (checkUserExists) {
        return res
          .status(400)
          .json({ message: "Email hoặc số điện thoại đã tồn tại." });
      }

      // Đăng ký người dùng
      const newUser = await USER_SERVICE.registerUser(payload);
      const sendMail = await MailQueue.sendVerifyEmail(EMAIL, otpType);
      if (!sendMail) {
        throw new Error("Gửi email xác minh thất bại");
      }
      const { PASSWORD, ...userWithoutPassword } = newUser;
      return res.status(201).json({
        success: true,
        message:
          "Đăng ký người dùng thành công. Vui lòng kiểm tra email để xác thực.",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).json({
        success: false,
        message: "Đăng ký người dùng thất bại!!!",
        error: error.message,
      });
    }
  };

  verifyUserByOTP = async (req, res) => {
    const { email, otp, otpType } = req.body;

    try {
      const user = await USER_SERVICE.verifyUserByOTP(email, otp);

      if (!user) {
        return res
          .status(404)
          .json({ errors: { otp: "Mã OTP không chính xác" } });
      }

      const otpDetail = user.OTP.find((item) => item.CODE === otp);
      const currentTime = Date.now();
      console.log(user.otpType);
      if (otpDetail.EXP_TIME < currentTime) {
        return res.status(400).json({ errors: { otp: "Mã OTP đã hết hạn" } });
      }
      if (user.otpType === "create_account") {
        res
          .status(200)
          .json({ message: "Kích hoạt người dùng thành công!", user });
      } else {
        res.status(200).json({ message: "Cập nhật Email thành công!", user });
      }
    } catch (error) {
      console.error("Error verifying OTP and activating user:", error);
      res.status(400).json({ errors: { otp: error.message } });
    }
  };

  forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      const existingEmail = await USER_SERVICE.checkEmailExists(email);
      if (!existingEmail) {
        return res.status(404).json({ message: "Email not found!!" });
      }
      const sendMail = await MailQueue.sendForgotPasswordEmail(email);
      if (!sendMail) {
        throw new Error("Gửi email xác minh thất bại");
      }

      return res.status(201).json({
        message: "Vui lòng kiểm tra email để xác thực.",
      });
    } catch (error) {
      console.error("Error handling forgot password request:", error);
      return res
        .status(500)
        .json({ message: "Đã xảy ra lỗi khi xử lý yêu cầu." });
    }
  };

  ResendOTP = async (req, res) => {
    try {
      const { email } = req.body;
      const existingEmail = await USER_SERVICE.checkEmailExists(email);
      if (!existingEmail) {
        return res.status(404).json({ message: "Email not found!!" });
      }
      const sendMail = await MailQueue.ResendOtp(email);
      if (!sendMail) {
        throw new Error("Gửi email xác minh thất bại");
      }

      return res.status(201).json({
        message: "Vui lòng kiểm tra email của bạn.",
      });
    } catch (error) {
      console.error("Error handling resendOTP request:", error);
      return res
        .status(500)
        .json({ message: "Đã xảy ra lỗi khi xử lý yêu cầu." });
    }
  };

  resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
      const isValid = await MailQueue.verifyOTP(email, otp, "reset_password");
      if (!isValid) {
        return res.status(500).json({ error: "Invalid or expired OTP." });
      }
      await USER_SERVICE.resetPassword(email, newPassword, otp);
      return res
        .status(200)
        .json({ message: "Password reset was successfully." });
    } catch (err) {
      res.status(500).json({ error: "Error resetting password" });
    }
  };

  login = async (req, res) => {
    const payload = req.body;
    const { error } = USER_VALIDATES.loginValidate.validate(payload);
    if (error) {
      return res.status(401).json({ message: error.details[0].message });
    }

    try {
      const user = await USER_SERVICE.checkUserExists(
        payload.EMAIL,
        payload.PHONE_NUMBER
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tồn tại.",
        });
      }

      if (!user.IS_ACTIVATED) {
        return res.status(403).json({
          success: false,
          message: "Tài khoản chưa được kích hoạt.",
        });
      }

      const isPasswordValid = await USER_SERVICE.checkPassword(
        payload.PASSWORD,
        user.PASSWORD
      );
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Mật khẩu không chính xác.",
        });
      }

      const data_sign = {
        userId: user._id,
      };
      const { accessToken, refreshToken } = await USER_SERVICE.login(data_sign);
      res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

      return res.status(200).json({
        success: true,
        accessToken: accessToken,
        message: user,
      });
    } catch (err) {
      console.error("Error logging in:", err);
      return res.status(500).json({
        success: false,
        message: "Đăng nhập thất bại.",
        error: err.message,
      });
    }
  };

  logout = async (req, res) => {
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    res.status(200).json({ message: "Logged out successfully" });
  };

  resetRefreshToken = async (req, res) => {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token is required" });
      }

      const newRefreshToken = await USER_SERVICE.resetRefreshToken(
        refreshToken
      );

      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      const accessToken = jwt.sign(
        { userId: decoded.userId },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "5h" }
      );

      res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);

      return res.status(200).json({ accessToken });
    } catch (error) {
      return res.status(401).json({ message: error.message });
    }
  };

  getUsers = async (req, res) => {
    try {
      const { tabStatus, page = 1, limit = 10, search = "" } = req.query;

      const result = await USER_SERVICE.getUsers(
        tabStatus,
        parseInt(page),
        parseInt(limit),
        search
      );

      res.status(200).json({
        success: true,
        data: result.users,
        totalPages: result.totalPages,
        totalCount: result.totalCount,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi truy vấn người dùng.",
        error: err.message,
      });
    }
  };

  blockUser = async (req, res) => {
    const payload = req.body;
    const { userId } = payload;
    const blocked_byuserid = req.user_id;

    const { error } = USER_VALIDATES.validateUserId(userId);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    try {
      const updatedUser = await USER_SERVICE.blockUser(
        userId,
        payload.IS_BLOCKED,
        blocked_byuserid
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  editUser = async (req, res) => {
    const userId = req.user_id;
    const data = req.body;
    const { newEMAIL, Password } = data;
    const otpType = "edit_account";
    try {
      const user = await USER_SERVICE.getUserInfo(userId);
      const checkUserExists = await USER_SERVICE.checkUserExists(
        data.EMAIL,
        data.PHONE_NUMBER
      );
      if (checkUserExists) {
        return res
          .status(400)
          .json({ message: "Email hoặc số điện thoại đã tồn tại." });
      }
      // Kiểm tra mật khẩu hiện tại
      const isPasswordValid = await USER_SERVICE.checkPassword(
        data.PASSWORD,
        user.PASSWORD
      );
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Mật khẩu không chính xác." });
      }
      if (data.EMAIL) {
        const updateData = await USER_SERVICE.editUser(userId, data);
        await USER_MODEL.findByIdAndUpdate(userId, updateData, { new: true });
        const sendMail = await MailQueue.sendVerifyEmail(data.EMAIL, otpType);
        if (!sendMail) {
          throw new Error("Gửi email xác minh thất bại");
        }

        return res
          .status(200)
          .json({ message: "Vui lòng kiểm tra email để xác thực." });
      } else {
        const updateData = await USER_SERVICE.editUser(userId, data);

        await USER_MODEL.findByIdAndUpdate(userId, updateData, { new: true });

        return res.status(200).json({
          message: "Thông tin người dùng đã được cập nhật thành công.",
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      return res
        .status(500)
        .json({ message: "Đã xảy ra lỗi khi cập nhật thông tin người dùng." });
    }
  };

  getUserById = async (req, res) => {
    try {
      const userId = req.params.id;

      const user = await USER_SERVICE.getUserInfo(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

module.exports = new USER_CONTROLLER();
