require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
const fs = require("fs")

// Import models
const User = require("./models/User")
const Weather = require("./models/Weather")

// Import routes
const authRoutes = require("./routes/auth")
const weatherRoutes = require("./routes/weather")

// Import middleware
const { authenticateToken, authorizeAdmin } = require("./middleware/auth")

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")))

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/f"
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB database"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Use routes
app.use("/api/auth", authRoutes)
app.use("/api/weather", weatherRoutes)

// User management routes
app.get("/api/users", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).lean()

    res.json({
      success: true,
      users: users.map((user) => ({
        ...user,
        _id: user._id.toString(),
      })),
      currentUser: req.user,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
})

app.put("/api/users/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, password, role, isVerified } = req.body

    // Find user
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update fields
    if (name) user.name = name
    if (email) user.email = email
    if (role) user.role = role
    if (isVerified !== undefined) user.isVerified = isVerified
    if (password) user.password = password // Will be hashed in pre-save hook

    await user.save()

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
})

app.delete("/api/users/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByIdAndDelete(id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
})

// User preferences route
app.put("/api/users/preferences", authenticateToken, async (req, res) => {
  try {
    const { temperature_unit, wind_unit, theme } = req.body

    // Update user preferences
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          "preferences.temperature_unit": temperature_unit,
          "preferences.wind_unit": wind_unit,
          "preferences.theme": theme,
        },
      },
      { new: true },
    )

    res.json({
      success: true,
      message: "Preferences updated successfully",
      preferences: user.preferences,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
})

// Seed weather data if none exists
async function seedWeatherData() {
  try {
    const count = await Weather.countDocuments()
    if (count === 0) {
      console.log("No weather data found, seeding database...")
      const weatherData = JSON.parse(fs.readFileSync(path.join(__dirname, "weather_data.json"), "utf8"))
      await Weather.insertMany(weatherData)
      console.log("Weather data seeded successfully!")
    }
  } catch (error) {
    console.error("Error seeding weather data:", error)
  }
}

// Seed admin user if none exists
async function seedAdminUser() {
  try {
    const adminExists = await User.findOne({ role: "admin" })
    if (!adminExists) {
      console.log("No admin user found, creating default admin...")
      const admin = new User({
        name: "Admin",
        email: "admin@weatherwise.com",
        password: "admin123", // Will be hashed by pre-save hook
        role: "admin",
        isVerified: true,
      })
      await admin.save()
      console.log("Default admin created successfully!")
    }
  } catch (error) {
    console.error("Error creating admin user:", error)
  }
}

// Serve HTML pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"))
})

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`)

  // Seed data after server starts
  await seedAdminUser()
  await seedWeatherData()
})
