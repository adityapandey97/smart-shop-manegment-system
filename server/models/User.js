// ============================================
//   User Model
//   Stores login info and role for each user
// ============================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Full name of the user
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    // Email address (used for login)
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // No two users can have same email
      lowercase: true,
    },

    // Password (will be stored encrypted, never plain text)
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },

    // Role determines what user can do in the app
    // owner = full access, manager = most access, staff = basic only
    role: {
      type: String,
      enum: ["owner", "manager", "staff"],
      default: "staff",
    },

    // Phone number for WhatsApp reminders
    phone: {
      type: String,
    },

    // Profile picture URL (stored in Cloudinary)
    avatar: {
      type: String,
      default: "",
    },

    // Is this account active or disabled?
    isActive: {
      type: Boolean,
      default: true,
    },

    // Last time this user logged in
    lastLogin: {
      type: Date,
    },
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true,
  }
);

// ----- Before saving, encrypt the password -----
// This runs automatically before every .save() call
userSchema.pre("save", async function (next) {
  // Only encrypt if password was changed (not on other updates)
  if (!this.isModified("password")) return next();

  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ----- Method to check if entered password is correct -----
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
