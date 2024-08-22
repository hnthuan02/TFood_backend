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
      type: String,
      required: true,
    },
    ROLE: {
      type: RoleSchema,
      required: true,
    },
    OTP: [
      {
        TYPE: {
          type: String,
        },
        CODE: {
          type: String,
        },
        TIME: {
          type: Date,
        },
        EXP_TIME: {
          type: Date,
        },
        CHECK_USING: {
          type: Boolean,
        },
      },
    ],
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
      default: 0,
    },
    IS_ACTIVATED: {
      type: Boolean,
    },
    IS_BLOCKED: {
      type: IsBlockedSchema,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Create model
const User = mongoose.model("User", UserSchema);

module.exports = User;
