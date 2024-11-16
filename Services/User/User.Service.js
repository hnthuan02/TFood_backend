const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const USER_MODEL = require("../../Models/User/User.Model");

class USER_SERVICE {
  async checkUserExists(email, phone) {
    const searchConditions = [];

    if (email) {
      searchConditions.push({ EMAIL: email });
    }
    if (phone) {
      searchConditions.push({ PHONE_NUMBER: phone });
    }

    if (searchConditions.length === 0) {
      return null;
    }

    return await USER_MODEL.findOne({
      $or: searchConditions,
    }).lean();
  }

  async checkEmailExists(email) {
    return await USER_MODEL.findOne({ EMAIL: email }).lean();
  }

  async registerUser(body) {
    const hash = await this.hashPassword(body.PASSWORD);

    const newUser = new USER_MODEL({
      FULLNAME: body.FULLNAME,
      EMAIL: body.EMAIL,
      PHONE_NUMBER: body.PHONE_NUMBER,
      PASSWORD: hash,
      ROLE: {
        ADMIN: false,
        BRANCH_MANAGER: false,
        STAFF: false,
      },
      ADDRESS: body.ADDRESS,
      IS_BLOCKED: null,
      IS_ACTIVATED: false,
    });

    const result = await newUser.save();
    return result.toObject();
  }

  async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async checkPassword(password, passwordDB) {
    try {
      return await bcrypt.compare(password, passwordDB);
    } catch (err) {
      throw new Error("Password comparison failed");
    }
  }

  // Hàm tạo refresh token
  generateRefreshToken = async (userId) => {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const expiresIn = "30d";
    const refreshToken = jwt.sign({ userId }, secret, { expiresIn });
    return refreshToken;
  };
  // Hàm cấp phát lại refresh token
  resetRefreshToken = async (oldRefreshToken) => {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const decoded = jwt.verify(oldRefreshToken, secret);

    // Tạo một refresh token mới
    const newRefreshToken = generateRefreshToken(decoded.userId);
    return newRefreshToken;
  };

  login = async (payload) => {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const expiresIn = "5h";
    const accessToken = jwt.sign(payload, secret, { expiresIn });
    const refreshToken = await this.generateRefreshToken(payload.userId);
    return { accessToken, refreshToken };
  };

  async getUserInfo(user_id) {
    const user = await USER_MODEL.findById(user_id).lean();

    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async updateUserOTP(email, otp, otpType, expTime) {
    try {
      const user = await USER_MODEL.findOneAndUpdate(
        { EMAIL: email },
        {
          $push: {
            OTP: {
              TYPE: otpType,
              CODE: otp,
              TIME: Date.now(),
              EXP_TIME: expTime,
              CHECK_USING: false,
            },
          },
        },
        { new: true }
      );
    } catch (error) {
      console.error("Error updating user OTP:", error);
    }
  }

  async updateOTPstatus(email, otp) {
    try {
      const user = await USER_MODEL.findOneAndUpdate(
        { EMAIL: email, "OTP.CODE": otp },
        { $set: { "OTP.$.CHECK_USING": true } },
        { new: true }
      );
      return user;
    } catch (error) {
      console.error("Error updating user OTP:", error);
    }
  }

  async verifyUserByOTP(email, otp) {
    const updatedUser = await USER_MODEL.findOneAndUpdate(
      { EMAIL: email, "OTP.CODE": otp },
      { $set: { IS_ACTIVATED: true, "OTP.$.CHECK_USING": true } },
      { new: true }
    );

    return updatedUser;
  }

  async resetPassword(email, newPassword, otp) {
    const hash = await this.hashPassword(newPassword);
    const result = await USER_MODEL.updateOne(
      { EMAIL: email, "OTP.CODE": otp },
      { $set: { PASSWORD: hash, "OTP.$.CHECK_USING": true } }
    );

    if (result.nModified === 0) {
      throw new Error("Failed to update password. User may not exist.");
    }

    return { success: true, message: "Password updated successfully." };
  }

  async getUsers(tabStatus, page, limit, search = "") {
    let query = {};

    switch (tabStatus) {
      case "1":
        query = {
          IS_ACTIVATED: false,
          "IS_BLOCKED.CHECK": { $ne: true },
        };
        break;
      case "2":
        query = { IS_ACTIVATED: true, "IS_BLOCKED.CHECK": { $ne: true } };
        break;
      case "3":
        query = { "IS_BLOCKED.CHECK": true };
        break;
      case "4":
        query = {};
        break;
      default:
        throw new Error("Invalid tab status");
    }

    if (search) {
      query.$or = [
        { FULLNAME: { $regex: new RegExp(search, "i") } },
        { EMAIL: { $regex: new RegExp(search, "i") } },
        { PHONE_NUMBER: { $regex: new RegExp(search, "i") } },
      ];
    }

    try {
      const totalCount = await USER_MODEL.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);
      const offset = (page - 1) * limit;

      const users = await USER_MODEL.find(query)
        .skip(offset)
        .limit(limit)
        .lean();

      // Đếm số lượng Staff và User dựa trên ROLE
      const totalStaff = await USER_MODEL.countDocuments({
        ...query,
        "ROLE.STAFF": true,
      });
      const totalUser = await USER_MODEL.countDocuments({
        ...query,
        "ROLE.STAFF": false,
        "ROLE.ADMIN": false,
      });

      return {
        users,
        totalPages,
        totalCount,
        totalStaff,
        totalUser,
      };
    } catch (error) {
      console.error("Error querying users:", error);
      throw new Error("Lỗi khi truy vấn người dùng");
    }
  }

  async blockUser(userId, isBlocked, blocked_byuserid) {
    const condition = { _id: userId };
    const data = {
      IS_BLOCKED: {
        CHECK: isBlocked,
        TIME: Date.now(),
        BLOCK_BY_USER_ID: blocked_byuserid,
      },
    };
    const options = { new: true };

    const foundUser = await USER_MODEL.findOneAndUpdate(
      condition,
      data,
      options
    );

    return foundUser;
  }

  async editUser(userId, data) {
    const user = await USER_MODEL.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const updateData = {};
    if (data.EMAIL) {
      updateData.EMAIL = data.EMAIL;
      updateData.IS_ACTIVATED = false;
    } else {
      if (data.FULLNAME) updateData.FULLNAME = data.FULLNAME;
      if (data.PHONE_NUMBER) updateData.PHONE_NUMBER = data.PHONE_NUMBER;
      if (data.ADDRESS) updateData.ADDRESS = data.ADDRESS;
    }
    return updateData;
  }

  async resetCumulativePoints() {
    try {
      const result = await User.updateMany(
        {}, // Cập nhật tất cả người dùng
        { $set: { CUMULATIVE_POINTS: 0 } } // Đặt CUMULATIVE_POINTS = 0
      );
      console.log(
        `Successfully reset cumulative points for ${result.modifiedCount} users.`
      );
    } catch (error) {
      console.error("Error resetting cumulative points:", error);
    }
  }
}

module.exports = new USER_SERVICE();
