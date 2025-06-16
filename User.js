const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

// User Schema for collection 'data'
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "customer"], default: "customer" },
    isVerified: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    locations: [{ type: String }],
    preferences: {
      temperature_unit: { type: String, enum: ["celsius", "fahrenheit"], default: "celsius" },
      wind_unit: { type: String, enum: ["kmh", "mph"], default: "kmh" },
      theme: { type: String, enum: ["light", "dark"], default: "light" },
    },
  },
  { collection: "data" },
)

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified or is new
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model("User", userSchema)

module.exports = User
