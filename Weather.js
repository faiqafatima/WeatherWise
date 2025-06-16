const mongoose = require("mongoose")

// Weather data schema
const weatherSchema = new mongoose.Schema(
  {
    city: { type: String, required: true },
    country: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true },
    },
    current: {
      temp: Number,
      feels_like: Number,
      humidity: Number,
      pressure: Number,
      wind_speed: Number,
      visibility: Number,
      description: String,
      icon: String,
      date: { type: Date, default: Date.now },
    },
    hourly: [
      {
        time: Date,
        temp: Number,
        description: String,
        icon: String,
      },
    ],
    daily: [
      {
        date: Date,
        temp_min: Number,
        temp_max: Number,
        description: String,
        icon: String,
      },
    ],
  },
  { collection: "weather" },
)

const Weather = mongoose.model("Weather", weatherSchema)

module.exports = Weather
