const Message = require("../../Models/Message/Message.Model");
const User = require("../../Models/User/User.Model");

// Lấy tin nhắn giữa hai người dùng
const getMessages = async (req, res) => {
  const { userId, receiverId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: receiverId },
        { senderId: receiverId, receiverId: userId },
      ],
    }).sort({ createdAt: 1 });

    const messagesWithSenderName = await Promise.all(
      messages.map(async (message) => {
        const sender = await User.findById(message.senderId);
        const senderName =
          sender.ROLE && (sender.ROLE.ADMIN || sender.ROLE.STAFF)
            ? "TFOOD"
            : sender.FULLNAME;

        return {
          ...message._doc,
          senderName,
        };
      })
    );

    res.status(200).json(messagesWithSenderName);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy tin nhắn." });
  }
};

module.exports = { getMessages };
