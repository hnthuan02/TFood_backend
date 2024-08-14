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
      RESTAURANT_ID: body.RESTAURANT_ID,
      FULLNAME: body.FULLNAME,
      EMAIL: body.EMAIL,
      PHONE_NUMBER: body.PHONE_NUMBER,
      PASSWORD: hash,
      ROLE: {
        ADMIN: false,
        BRANCH_MANAGER: false,
        STAFF: false,
        SHIPPER: false,
      },
      ADDRESS: body.ADDRESS,
      GENDER: body.GENDER,
      IS_BLOCKED: body.IS_BLOCKED || { TIME: null, CHECK: false },
    });

    const result = await newUser.save();
    return result.toObject();
  }

  async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async checkPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (err) {
      throw new Error("Password comparison failed");
    }
  }

  login = async (payload) => {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const expiresIn = "5h";
    const accessToken = jwt.sign(payload, secret, { expiresIn });
    return accessToken;
  };

  async getUserInfo(user_id) {
    const user = await USER_MODEL.findById(user_id);

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

  async verifyOTPAndActivateUser(email, otp) {
    const updatedUser = await USER_MODEL.findOneAndUpdate(
      { EMAIL: email, "OTP.CODE": otp },
      { $set: { IS_ACTIVATED: true, "OTP.$.CHECK_USING": true } },
      { new: true }
    );

    return updatedUser;
  }

  async resetPassword(email, newPassword) {
    const hash = await this.hashPassword(newPassword);
    const result = await USER_MODEL.updateOne(
      { EMAIL: email },
      { $set: { PASSWORD: hash } }
    );

    if (result.nModified === 0) {
      throw new Error("Failed to update password. User may not exist.");
    }

    return { success: true, message: "Password updated successfully." };
  }
}

module.exports = new USER_SERVICE();
