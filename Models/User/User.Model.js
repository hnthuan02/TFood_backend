const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RoleSchema = new Schema(
  {
    ADMIN: {
      type: Boolean,
      default: false,
    },
    BRANCH_MANAGER: {
      type: Boolean,
      default: false,
    },
    STAFF: {
      type: Boolean,
      default: false,
    },
    SHIPPER: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const IsBlockedSchema = new Schema(
  {
    TIME: {
      type: Date,
    },
    CHECK: {
      type: Boolean,
    },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    user_Id: {
      type: Schema.Types.ObjectId,
    },
    RESTAURANT_ID: {
      type: Schema.Types.ObjectId,
    },
    FULLNAME: {
      type: String,
      required: true,
    },
    EMAIL: {
      type: String,
      required: true,
    },
    PHONE_NUMBER: {
      type: String,
      required: true,
    },
    PASSWORD: {
      // Note: Corrected from PASWORD to PASSWORD
      type: String,
      required: true,
    },
    ROLE: {
      type: RoleSchema,
      required: true,
    },
    ADDRESS: {
      type: String,
      required: true,
    },
    GENDER: {
      type: String,
      required: true,
    },
    CUMULATIVE_POINTS: {
      type: Number,
      required: true,
    },
    IS_BLOCKED: {
      type: IsBlockedSchema,
      required: true,
    },
  },
  {
    timestamps: { createdAt: "CREATE_AT", updatedAt: "UPDATE_AT" },
    versionKey: false,
  }
);

// Create model
const User = mongoose.model("User", UserSchema);

module.exports = User;
