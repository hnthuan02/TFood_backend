const USER_MODEL = require("../../Models/User/User.Model");

class USER_SERVICE {
  async registerUser(body) {
    const user = new USER_MODEL({
      username: body.username,
      email: body.email,
      password: body.password,
    });
    const result = await user.save();
    return result;
  }
}

module.exports = new USER_SERVICE();
