const USER_MODEL = require("../../Models/User/User.Model");
const USER_SERVICE = require("../../Services/User/User.Service");

class USER_CONTROLLER {
  registerUser = async (req, res) => {
    try {
      const user = await USER_SERVICE.registerUser(req.body);
      res.status(201).send(user);
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  };
}

module.exports = new USER_CONTROLLER();
