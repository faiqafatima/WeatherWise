// DOM Elements
const searchLocationInput = document.getElementById("search-location")
const searchBtn = document.getElementById("search-btn")
const weatherDisplay = document.getElementById("weather-display")
const hourlyForecastContainer = document.getElementById("hourly-forecast-container")
const weeklyForecastContainer = document.getElementById("weekly-forecast-container")
const forecastLocationSelect = document.getElementById("forecast-location")
const tabButtons = document.querySelectorAll(".tab-btn")
const tabContents = document.querySelectorAll(".tab-content")

// Weather icons mapping
const weatherIcons = {
  "01d": "fa-sun",
  "01n": "fa-moon",
  "02d": "fa-cloud-sun",
  "02n": "fa-cloud-moon",
  "03d": "fa-cloud",
  "03n": "fa-cloud",
  "04d": "fa-cloud",
  "04n": "fa-cloud",
  "09d": "fa-cloud-showers-heavy",
  "09n": "fa-cloud-showers-heavy",
  "10d": "fa-cloud-sun-rain",
  "10n": "fa-cloud-moon-rain",
  "11d": "fa-bolt",
  "11n": "fa-bolt",
  "13d": "fa-snowflake",
  "13n": "fa-snowflake",
  "50d": "fa-smog",
  "50n": "fa-smog",
}

// Check if user is authenticated
function isAuthenticated() {
  return localStorage.getItem("token") !== null
}

// Initialize weather data
function initWeather() {
  // Only fetch weather data if user is authenticated
  if (!isAuthenticated()) {
    return
  }

  // First try to get user's saved locations
  fetchSavedLocations()
    .then((locations) => {
      if (locations && locations.length > 0) {
        // Use the first saved location
        fetchWeatherForCity(locations[0])

        // If there's a forecast location selector, populate it
        if (forecastLocationSelect) {
          populateLocationSelector(locations)
        }
      } else {
        // If no saved locations, use geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude
              const lon = position.coords.longitude

              // Use reverse geocoding to get city name
              fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=your_api_key`)
                .then((response) => response.json())
                .then((data) => {
                  if (data && data.length > 0) {
                    fetchWeatherForCity(data[0].name)
                  } else {
                    // Fallback to default city
                    fetchWeatherForCity("New York")
                  }
                })
                .catch(() => fetchWeatherForCity("New York"))
            },
            () => fetchWeatherForCity("New York"), // Error fallback
          )
        } else {
          // Geolocation not supported, use default city
          fetchWeatherForCity("New York")
        }
      }
    })
    .catch(() => {
      // If error fetching saved locations, use default city
      fetchWeatherForCity("New York")
    })
}

// Fetch user's saved locations
async function fetchSavedLocations() {
  try {
    const token = localStorage.getItem("token")
    if (!token) return []

    const response = await fetch("/api/weather/saved-locations", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) throw new Error("Failed to fetch saved locations")

    const data = await response.json()
    if (!data.success) throw new Error(data.message || "Failed to fetch saved locations")

    // Return array of city names
    return data.data.map((location) => location.city)
  } catch (error) {
    console.error("Error fetching saved locations:", error)
    return []
  }
}

// Populate location selector
function populateLocationSelector(locations) {
  if (!forecastLocationSelect) return

  // Clear previous options except the first one (Current Location)
  while (forecastLocationSelect.options.length > 1) {
    forecastLocationSelect.remove(1)
  }

  // Add saved locations to the selector
  locations.forEach((city) => {
    const option = document.createElement("option")
    option.value = city
    option.textContent = city
    forecastLocationSelect.appendChild(option)
  })
}

// Fetch weather data for a city from our backend
async function fetchWeatherForCity(cityName) {
  try {
    // Show loading state
    if (weatherDisplay) {
      weatherDisplay.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <i class="fas fa-spinner fa-spin fa-3x" style="color: var(--primary-color);"></i>
          <p style="margin-top: 1rem;">Loading weather data...</p>
        </div>
      `
    }

    // Fetch from our backend API
    const response = await fetch(`/api/weather/city/${encodeURIComponent(cityName)}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch weather data for ${cityName}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || `Failed to fetch weather data for ${cityName}`)
    }

    // Update UI with weather data
    const weatherData = data.data
    updateCurrentWeather(weatherData)
    updateHourlyForecast(weatherData.hourly)
    updateWeeklyForecast(weatherData.daily)

    // Update all instances of city name in the UI
    document.querySelectorAll(".current-location-name").forEach((el) => {
      el.textContent = `${weatherData.city}, ${weatherData.country}`
    })
  } catch (error) {
    console.error("Error fetching weather data:", error)

    // Show error state
    if (weatherDisplay) {
      weatherDisplay.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <i class="fas fa-exclamation-triangle fa-3x" style="color: #dc3545;"></i>
          <p style="margin-top: 1rem;">Failed to load weather data. Please try again later.</p>
          <button id="retry-weather" class="btn btn-primary" style="margin-top: 1rem;">Retry</button>
        </div>
      `

      document.getElementById("retry-weather").addEventListener("click", () => {
        fetchWeatherForCity(cityName)
      })
    }

    // Fallback to mock data
    useMockWeatherDataForCity(cityName)
  }
}

// Update current weather UI
function updateCurrentWeather(data) {
  if (!weatherDisplay) return

  const date = new Date()
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const iconCode = data.current.icon
  const iconClass = weatherIcons[iconCode] || "fa-cloud"

  weatherDisplay.innerHTML = `
    <div class="location-info">
      <h3>${data.city}, ${data.country}</h3>
      <p class="date">${formattedDate}</p>
    </div>
    <div class="weather-info">
      <div class="temperature">
        <span class="temp">${Math.round(data.current.temp)}°C</span>
        <span class="feels-like">Feels like: ${Math.round(data.current.feels_like)}°C</span>
      </div>
      <div class="weather-icon">
        <i class="fas ${iconClass} fa-2x"></i>
        <p>${data.current.description}</p>
      </div>
    </div>
    <div class="weather-details">
      <div class="detail">
        <i class="fas fa-wind"></i>
        <span>Wind: ${Math.round(data.current.wind_speed)} km/h</span>
      </div>
      <div class="detail">
        <i class="fas fa-tint"></i>
        <span>Humidity: ${data.current.humidity}%</span>
      </div>
      <div class="detail">
        <i class="fas fa-compress-arrows-alt"></i>
        <span>Pressure: ${data.current.pressure} hPa</span>
      </div>
      <div class="detail">
        <i class="fas fa-eye"></i>
        <span>Visibility: ${data.current.visibility} km</span>
      </div>
    </div>
  `
}

// Update hourly forecast UI
function updateHourlyForecast(hourlyData) {
  if (!hourlyForecastContainer) return

  // Clear previous data
  hourlyForecastContainer.innerHTML = ""

  // Only show next 8 hours
  const next8Hours = hourlyData.slice(0, 8)

  next8Hours.forEach((hour, index) => {
    const time = new Date(hour.time)
    const formattedTime = index === 0 ? "Now" : time.toLocaleTimeString("en-US", { hour: "numeric" })

    const iconCode = hour.icon
    const iconClass = weatherIcons[iconCode] || "fa-cloud"

    const hourlyItem = document.createElement("div")
    hourlyItem.className = "forecast-item"
    hourlyItem.innerHTML = `
      <p class="time">${formattedTime}</p>
      <i class="fas ${iconClass}"></i>
      <p class="temp">${Math.round(hour.temp)}°C</p>
    `

    hourlyForecastContainer.appendChild(hourlyItem)
  })
}

// Update weekly forecast UI
function updateWeeklyForecast(dailyData) {
  if (!weeklyForecastContainer) return

  // Clear previous data
  weeklyForecastContainer.innerHTML = ""

  dailyData.forEach((day) => {
    const date = new Date(day.date)
    const formattedDay = date.toLocaleDateString("en-US", { weekday: "short" })

    const iconCode = day.icon
    const iconClass = weatherIcons[iconCode] || "fa-cloud"

    const dailyItem = document.createElement("div")
    dailyItem.className = "forecast-item weekly"
    dailyItem.innerHTML = `
      <p class="day">${formattedDay}</p>
      <i class="fas ${iconClass}"></i>
      <div class="temp-range">
        <span class="max">${Math.round(day.temp_max)}°C</span>
        <span class="min">${Math.round(day.temp_min)}°C</span>
      </div>
    `

    weeklyForecastContainer.appendChild(dailyItem)
  })
}

// Search for location
async function searchLocation(query) {
  // Only search if user is authenticated
  if (!isAuthenticated()) {
    alert("Please login to search for locations.")
    return
  }

  try {
    fetchWeatherForCity(query)
  } catch (error) {
    console.error("Error searching location:", error)
    alert("Location not found. Please try again.")
  }
}

// Save a location for the user
async function saveLocation(cityName) {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      alert("Please login to save locations.")
      return false
    }

    const response = await fetch("/api/weather/save-location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cityName }),
    })

    const data = await response.json()

    if (!response.ok) {
      alert(data.message || "Failed to save location")
      return false
    }

    alert(`${cityName} has been added to your saved locations!`)
    return true
  } catch (error) {
    console.error("Error saving location:", error)
    alert("Failed to save location. Please try again.")
    return false
  }
}

// Use mock weather data for demo purposes
function useMockWeatherData() {
  const mockCurrentWeather = {
    city: "New York",
    country: "US",
    coordinates: {
      lat: 40.7128,
      lon: -74.006,
    },
    current: {
      temp: 24,
      feels_like: 26,
      humidity: 65,
      pressure: 1015,
      wind_speed: 5,
      visibility: 10,
      description: "Partly Cloudy",
      icon: "02d",
    },
    hourly: [
      { time: new Date(), temp: 24, description: "Partly Cloudy", icon: "02d" },
      { time: new Date(Date.now() + 3600000), temp: 25, description: "Scattered Clouds", icon: "03d" },
      { time: new Date(Date.now() + 7200000), temp: 26, description: "Partly Cloudy", icon: "02d" },
      { time: new Date(Date.now() + 10800000), temp: 27, description: "Sunny", icon: "01d" },
      { time: new Date(Date.now() + 14400000), temp: 26, description: "Sunny", icon: "01d" },
      { time: new Date(Date.now() + 18000000), temp: 25, description: "Partly Cloudy", icon: "02d" },
      { time: new Date(Date.now() + 21600000), temp: 23, description: "Scattered Clouds", icon: "03d" },
      { time: new Date(Date.now() + 25200000), temp: 22, description: "Scattered Clouds", icon: "03d" },
    ],
    daily: [
      { date: new Date(), temp_min: 20, temp_max: 27, description: "Partly Cloudy", icon: "02d" },
      {
        date: new Date(Date.now() + 86400000),
        temp_min: 19,
        temp_max: 25,
        description: "Scattered Clouds",
        icon: "03d",
      },
      { date: new Date(Date.now() + 172800000), temp_min: 18, temp_max: 23, description: "Light Rain", icon: "10d" },
      { date: new Date(Date.now() + 259200000), temp_min: 17, temp_max: 22, description: "Moderate Rain", icon: "09d" },
      { date: new Date(Date.now() + 345600000), temp_min: 18, temp_max: 24, description: "Partly Cloudy", icon: "02d" },
      { date: new Date(Date.now() + 432000000), temp_min: 20, temp_max: 26, description: "Sunny", icon: "01d" },
      { date: new Date(Date.now() + 518400000), temp_min: 21, temp_max: 28, description: "Sunny", icon: "01d" },
    ],
  }

  updateCurrentWeather(mockCurrentWeather)
  updateHourlyForecast(mockCurrentWeather.hourly)
  updateWeeklyForecast(mockCurrentWeather.daily)
}

// Use mock weather data for a specific city
function useMockWeatherDataForCity(city) {
  const mockData = {
    city: city,
    country: "US",
    coordinates: {
      lat: 40.7128,
      lon: -74.006,
    },
    current: {
      temp: Math.floor(Math.random() * 15) + 15, // Random temp between 15-30°C
      feels_like: Math.floor(Math.random() * 15) + 15,
      humidity: Math.floor(Math.random() * 50) + 30, // Random humidity between 30-80%
      pressure: Math.floor(Math.random() * 30) + 1000, // Random pressure
      wind_speed: Math.floor(Math.random() * 20) + 1, // Random wind speed
      visibility: 10,
      description: "Partly Cloudy",
      icon: "02d",
    },
    hourly: Array.from({ length: 8 }, (_, i) => ({
      time: new Date(Date.now() + i * 3600000),
      temp: Math.floor(Math.random() * 15) + 15,
      description: "Partly Cloudy",
      icon: ["01d", "02d", "03d", "04d", "10d"][Math.floor(Math.random() * 5)],
    })),
    daily: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000),
      temp_min: Math.floor(Math.random() * 10) + 10,
      temp_max: Math.floor(Math.random() * 10) + 20,
      description: "Partly Cloudy",
      icon: ["01d", "02d", "03d", "04d", "10d"][Math.floor(Math.random() * 5)],
    })),
  }

  updateCurrentWeather(mockData)
  updateHourlyForecast(mockData.hourly)
  updateWeeklyForecast(mockData.daily)
}

// Event listeners
if (searchBtn && searchLocationInput) {
  searchBtn.addEventListener("click", () => {
    const query = searchLocationInput.value.trim()
    if (query) {
      searchLocation(query)
    }
  })

  searchLocationInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const query = searchLocationInput.value.trim()
      if (query) {
        searchLocation(query)
      }
    }
  })
}

// Tab functionality for forecast page
if (tabButtons.length > 0 && tabContents.length > 0) {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab")

      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      // Add active class to clicked button and corresponding content
      button.classList.add("active")
      document.getElementById(`${tabId}-tab`).classList.add("active")
    })
  })
}

// Location selector in forecast page
if (forecastLocationSelect) {
  forecastLocationSelect.addEventListener("change", () => {
    const selectedLocation = forecastLocationSelect.value

    if (selectedLocation === "current") {
      // Use current location
      initWeather()
    } else {
      // Use selected location
      fetchWeatherForCity(selectedLocation)
    }
  })
}

// Add save location button event for search results
document.addEventListener("click", (e) => {
  if (e.target && e.target.classList.contains("save-location-btn")) {
    const cityName = e.target.getAttribute("data-city")
    if (cityName) {
      saveLocation(cityName)
    }
  }
})

// Initialize weather on page load
document.addEventListener("DOMContentLoaded", () => {
  // Only initialize weather if user is authenticated
  if (isAuthenticated()) {
    initWeather()
  }
})

// Listen for authentication changes
window.addEventListener("storage", (event) => {
  if (event.key === "token") {
    if (event.newValue) {
      // User logged in
      initWeather()
    }
  }
})
