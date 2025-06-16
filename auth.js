// DOM Elements
const loginModal = document.getElementById("login-modal")
const signupModal = document.getElementById("signup-modal")
const forgotPasswordModal = document.getElementById("forgot-password-modal")
const loginBtn = document.getElementById("login-btn")
const signupBtn = document.getElementById("signup-btn")
const footerLoginBtn = document.getElementById("footer-login")
const footerSignupBtn = document.getElementById("footer-signup")
const footerForgotPasswordBtn = document.getElementById("footer-forgot-password")
const forgotPasswordLink = document.getElementById("forgot-password-link")
const logoutBtn = document.getElementById("logout-btn")
const closeButtons = document.querySelectorAll(".close")
const loginForm = document.getElementById("login-form")
const signupForm = document.getElementById("signup-form")
const forgotPasswordForm = document.getElementById("forgot-password-form")
const userProfile = document.querySelector(".user-profile")
const authButtons = document.querySelector(".auth-buttons")
const userName = document.getElementById("user-name")
const getStartedBtn = document.getElementById("get-started-btn")
const signupCtaBtn = document.getElementById("signup-cta-btn")
const weatherContent = document.getElementById("weather-content")
const landingPage = document.getElementById("landing-page")
const body = document.body

// API URL
const API_URL = "/api"

// Check if user is logged in
function checkAuthStatus() {
  const token = localStorage.getItem("token")
  const userRole = localStorage.getItem("userRole")

  if (token) {
    // User is logged in
    if (authButtons) {
      authButtons.querySelector("#login-btn").classList.add("hidden")
      authButtons.querySelector("#signup-btn").classList.add("hidden")
      userProfile.classList.remove("hidden")
    }

    // Update user name in dashboard if it exists
    const userNameFromStorage = localStorage.getItem("userName")
    if (userName && userNameFromStorage) {
      userName.textContent = userNameFromStorage
    }

    // Show weather content and hide landing page
    body.classList.add("authenticated")

    // Add role-specific class
    if (userRole === "admin") {
      body.classList.add("admin-user")

      // Add admin link to dropdown if not exists
      if (userProfile && !document.querySelector('.dropdown-content a[href="/admin"]')) {
        const adminLink = document.createElement("a")
        adminLink.href = "/admin"
        adminLink.textContent = "Admin Dashboard"
        userProfile
          .querySelector(".dropdown-content")
          .insertBefore(adminLink, userProfile.querySelector(".dropdown-content a:first-child"))
      }
    } else {
      body.classList.add("customer-user")
    }

    return true
  } else {
    // User is not logged in
    if (authButtons) {
      authButtons.querySelector("#login-btn").classList.remove("hidden")
      authButtons.querySelector("#signup-btn").classList.remove("hidden")
      userProfile.classList.add("hidden")
    }

    // Hide weather content and show landing page
    body.classList.remove("authenticated")
    body.classList.remove("admin-user")
    body.classList.remove("customer-user")

    return false
  }
}

// Open modal function
function openModal(modal) {
  if (modal) {
    modal.style.display = "block"

    // Focus the first input field
    const firstInput = modal.querySelector("input")
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100)
    }

    // Add overlay class to body
    document.body.classList.add("modal-open")
  }
}

// Close modal function
function closeModal(modal) {
  if (modal) {
    modal.style.display = "none"
    document.body.classList.remove("modal-open")
  }
}

// Close all modals
function closeAllModals() {
  const modals = document.querySelectorAll(".modal")
  modals.forEach((modal) => {
    closeModal(modal)
  })
}

// Show notification to user
function showNotification(message, type = "success") {
  // Remove any existing notifications
  const existingNotification = document.querySelector(".notification")
  if (existingNotification) {
    existingNotification.remove()
  }

  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close">×</button>
  `

  // Add to document
  document.body.appendChild(notification)

  // Add close functionality
  notification.querySelector(".notification-close").addEventListener("click", () => {
    notification.classList.add("notification-hide")
    setTimeout(() => notification.remove(), 300)
  })

  // Auto close after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.classList.add("notification-hide")
      setTimeout(() => notification.remove(), 300)
    }
  }, 5000)
}

// Event listeners for opening modals
if (loginBtn) {
  loginBtn.addEventListener("click", () => openModal(loginModal))
}

if (signupBtn) {
  signupBtn.addEventListener("click", () => openModal(signupModal))
}

if (footerLoginBtn) {
  footerLoginBtn.addEventListener("click", () => openModal(loginModal))
}

if (footerSignupBtn) {
  footerSignupBtn.addEventListener("click", () => openModal(signupModal))
}

if (footerForgotPasswordBtn) {
  footerForgotPasswordBtn.addEventListener("click", () => openModal(forgotPasswordModal))
}

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault()
    closeModal(loginModal)
    openModal(forgotPasswordModal)
  })
}

// Get Started and CTA buttons
if (getStartedBtn) {
  getStartedBtn.addEventListener("click", () => openModal(signupModal))
}

if (signupCtaBtn) {
  signupCtaBtn.addEventListener("click", () => openModal(signupModal))
}

// Event listeners for closing modals
closeButtons.forEach((button) => {
  button.addEventListener("click", function () {
    closeModal(this.closest(".modal"))
  })
})

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    closeModal(e.target)
  }
})

// Login form submission
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Disable submit button
    const submitButton = loginForm.querySelector('button[type="submit"]')
    submitButton.disabled = true
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...'

    const email = document.getElementById("login-email").value
    const password = document.getElementById("login-password").value
    const role = document.querySelector('input[name="login-role"]:checked').value

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store token and user info
        localStorage.setItem("token", data.token)
        localStorage.setItem("userId", data.user._id)
        localStorage.setItem("userName", data.user.name)
        localStorage.setItem("userRole", data.user.role)

        // Update UI
        checkAuthStatus()
        closeModal(loginModal)

        // Show success message
        showNotification("Login successful! Welcome back.", "success")

        // Redirect based on role
        if (data.user.role === "admin") {
          window.location.href = "/admin"
        } else {
          // Refresh the page to update UI
          window.location.reload()
        }
      } else {
        // Show error
        showNotification(data.message || "Login failed. Please check your credentials.", "error")

        // Reset button
        submitButton.disabled = false
        submitButton.innerHTML = "Login"
      }
    } catch (error) {
      console.error("Login error:", error)
      showNotification("Network error. Please check your connection and try again.", "error")

      // Reset button
      submitButton.disabled = false
      submitButton.innerHTML = "Login"

      // For demo purposes only, simulate login
      if (process.env.NODE_ENV !== "production") {
        simulateSuccessfulLogin(email, role)
      }
    }
  })
}

// Signup form submission
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Disable submit button
    const submitButton = signupForm.querySelector('button[type="submit"]')
    submitButton.disabled = true
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...'

    const name = document.getElementById("signup-name").value
    const email = document.getElementById("signup-email").value
    const password = document.getElementById("signup-password").value
    const confirmPassword = document.getElementById("signup-confirm-password").value
    const role = document.querySelector('input[name="signup-role"]:checked').value

    // Validate passwords match
    if (password !== confirmPassword) {
      showNotification("Passwords do not match!", "error")
      submitButton.disabled = false
      submitButton.innerHTML = "Sign Up"
      return
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        closeModal(signupModal)
        showNotification("Registration successful! Please check your email to verify your account.", "success")
        openModal(loginModal)

        // Reset form
        signupForm.reset()
      } else {
        showNotification(data.message || "Registration failed. Please try again.", "error")
      }

      // Reset button
      submitButton.disabled = false
      submitButton.innerHTML = "Sign Up"
    } catch (error) {
      console.error("Signup error:", error)
      showNotification("Network error. Please check your connection and try again.", "error")

      // Reset button
      submitButton.disabled = false
      submitButton.innerHTML = "Sign Up"

      // For demo purposes only
      if (process.env.NODE_ENV !== "production") {
        simulateSuccessfulRegistration(name, email, role)
      }
    }
  })
}

// Forgot password form submission
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Disable submit button
    const submitButton = forgotPasswordForm.querySelector('button[type="submit"]')
    submitButton.disabled = true
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending reset link...'

    const email = document.getElementById("reset-email").value

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        closeModal(forgotPasswordModal)
        showNotification("Password reset link has been sent to your email!", "success")
        forgotPasswordForm.reset()
      } else {
        showNotification(data.message || "Failed to send reset link. Please try again.", "error")
      }

      // Reset button
      submitButton.disabled = false
      submitButton.innerHTML = "Send Reset Link"
    } catch (error) {
      console.error("Forgot password error:", error)
      showNotification("Network error. Please check your connection and try again.", "error")

      // Reset button
      submitButton.disabled = false
      submitButton.innerHTML = "Send Reset Link"

      // For demo purposes only
      if (process.env.NODE_ENV !== "production") {
        simulateSuccessfulPasswordReset(email)
      }
    }
  })
}

// Logout functionality
if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault()

    // Clear local storage
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    localStorage.removeItem("userName")
    localStorage.removeItem("userRole")

    // Update UI
    checkAuthStatus()

    // Show notification
    showNotification("You have been logged out successfully.", "success")

    // Redirect to home page
    window.location.href = "/"
  })
}

// Simulate successful login (for demo purposes)
function simulateSuccessfulLogin(email, role) {
  const name = email.split("@")[0]
  localStorage.setItem("token", "demo-token-12345")
  localStorage.setItem("userId", "demo-user-id")
  localStorage.setItem("userName", name)
  localStorage.setItem("userRole", role)

  checkAuthStatus()
  closeModal(loginModal)
  showNotification("Login successful! Welcome back.", "success")

  // Redirect based on role
  if (role === "admin") {
    window.location.href = "/admin"
  } else {
    window.location.reload()
  }
}

// Simulate successful registration (for demo purposes)
function simulateSuccessfulRegistration(name, email, role) {
  closeModal(signupModal)
  showNotification(
    `Registration successful! A confirmation email has been sent to ${email}. Please verify your account.`,
    "success",
  )
  openModal(loginModal)
}

// Simulate successful password reset (for demo purposes)
function simulateSuccessfulPasswordReset(email) {
  closeModal(forgotPasswordModal)
  showNotification(`Password reset link has been sent to ${email}!`, "success")
}

// Check auth status on page load
document.addEventListener("DOMContentLoaded", checkAuthStatus)

// Add CSS for notifications
const notificationStyles = document.createElement("style")
notificationStyles.textContent = `
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 350px;
    background-color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    padding: 16px;
    z-index: 10000;
    transform: translateY(0);
    transition: transform 0.3s ease, opacity 0.3s ease;
    animation: notification-slide-in 0.3s ease;
  }
  
  .notification-content {
    display: flex;
    align-items: center;
  }
  
  .notification-content i {
    margin-right: 12px;
    font-size: 20px;
  }
  
  .notification-success {
    border-left: 4px solid #28a745;
  }
  
  .notification-success i {
    color: #28a745;
  }
  
  .notification-error {
    border-left: 4px solid #dc3545;
  }
  
  .notification-error i {
    color: #dc3545;
  }
  
  .notification-close {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #888;
  }
  
  .notification-hide {
    transform: translateY(-20px);
    opacity: 0;
  }
  
  @keyframes notification-slide-in {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .modal-open {
    overflow: hidden;
  }
`

document.head.appendChild(notificationStyles)
