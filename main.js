// DOM Elements
const createAlertBtn = document.getElementById("create-alert-btn")
const createAlertModal = document.getElementById("create-alert-modal")
const createAlertForm = document.getElementById("create-alert-form")
const alertTypeSelect = document.getElementById("alert-type")
const thresholdUnit = document.querySelector(".threshold-unit")
const addLocationBtn = document.getElementById("add-location-btn")
const addLocationInput = document.getElementById("add-location")

// Initialize the application
function initApp() {
  // Set up event listeners
  setupEventListeners()

  // Initialize components
  initializeComponents()
}

// Set up event listeners
function setupEventListeners() {
  // Create alert button
  if (createAlertBtn) {
    createAlertBtn.addEventListener("click", () => {
      if (createAlertModal) {
        createAlertModal.style.display = "block"
      }
    })
  }

  // Close modal when clicking on close button
  const closeButtons = document.querySelectorAll(".close")
  closeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const modal = this.closest(".modal")
      if (modal) {
        modal.style.display = "none"
      }
    })
  })

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none"
    }
  })

  // Alert type change
  if (alertTypeSelect) {
    alertTypeSelect.addEventListener("change", updateThresholdUnit)
  }

  // Create alert form submission
  if (createAlertForm) {
    createAlertForm.addEventListener("submit", handleCreateAlert)
  }

  // Add location button
  if (addLocationBtn && addLocationInput) {
    addLocationBtn.addEventListener("click", handleAddLocation)

    addLocationInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleAddLocation()
      }
    })
  }
}

// Initialize components
function initializeComponents() {
  // Update threshold unit based on initial alert type
  if (alertTypeSelect) {
    updateThresholdUnit()
  }
}

// Update threshold unit based on alert type
function updateThresholdUnit() {
  if (!thresholdUnit) return

  const alertType = alertTypeSelect.value

  switch (alertType) {
    case "temperature":
      thresholdUnit.textContent = "°C"
      break
    case "precipitation":
      thresholdUnit.textContent = "mm"
      break
    case "wind":
      thresholdUnit.textContent = "km/h"
      break
    case "humidity":
      thresholdUnit.textContent = "%"
      break
    default:
      thresholdUnit.textContent = ""
  }
}

// Handle create alert form submission
function handleCreateAlert(e) {
  e.preventDefault()

  const location = document.getElementById("alert-location").value
  const alertType = document.getElementById("alert-type").value
  const threshold = document.getElementById("alert-threshold").value
  const condition = document.getElementById("alert-condition").value

  if (!location || !alertType || !threshold || !condition) {
    alert("Please fill in all fields")
    return
  }

  // In a real application, you would send this data to your backend
  console.log("Creating alert:", { location, alertType, threshold, condition })

  // For demo purposes, show success message and close modal
  alert(`Alert created for ${location}!`)

  if (createAlertModal) {
    createAlertModal.style.display = "none"
  }

  // Reset form
  createAlertForm.reset()
}

// Handle add location
function handleAddLocation() {
  const locationName = addLocationInput.value.trim()

  if (!locationName) {
    alert("Please enter a location name")
    return
  }

  // In a real application, you would validate the location and add it to the user's saved locations
  console.log("Adding location:", locationName)

  // For demo purposes, show success message and clear input
  alert(`Location "${locationName}" added to your saved locations!`)
  addLocationInput.value = ""

  // Refresh the page to show the new location
  // In a real application, you would update the UI without refreshing
  // window.location.reload();

  // For demo purposes, add the location to the list
  addLocationToList(locationName)
}

// Add location to the list (for demo purposes)
function addLocationToList(locationName) {
  const locationsList = document.querySelector(".locations-list")
  if (!locationsList) return

  const temperature = Math.floor(Math.random() * 15) + 15 // Random temperature between 15-30°C
  const weatherIcons = ["fa-sun", "fa-cloud-sun", "fa-cloud", "fa-cloud-rain", "fa-cloud-showers-heavy"]
  const randomIcon = weatherIcons[Math.floor(Math.random() * weatherIcons.length)]

  const locationCard = document.createElement("div")
  locationCard.className = "location-card"
  locationCard.innerHTML = `
        <div class="location-info">
            <h3>${locationName}</h3>
            <p>Added Location</p>
        </div>
        <div class="location-weather">
            <div class="location-temp">${temperature}°C</div>
            <div class="location-icon">
                <i class="fas ${randomIcon}"></i>
            </div>
        </div>
        <div class="location-actions">
            <button class="btn btn-small">View Details</button>
            <button class="btn btn-small btn-outline">Remove</button>
        </div>
    `

  locationsList.appendChild(locationCard)
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", initApp)
