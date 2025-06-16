document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const usersTableBody = document.getElementById("users-table-body")
  const addUserBtn = document.getElementById("add-user-btn")
  const addUserModal = document.getElementById("add-user-modal")
  const editUserModal = document.getElementById("edit-user-modal")
  const deleteUserModal = document.getElementById("delete-user-modal")
  const closeButtons = document.querySelectorAll(".close")
  const addUserForm = document.getElementById("add-user-form")
  const editUserForm = document.getElementById("edit-user-form")
  const searchInput = document.getElementById("search-users")
  const searchBtn = document.getElementById("search-btn")
  const roleFilter = document.getElementById("role-filter")
  const statusFilter = document.getElementById("status-filter")
  const logoutBtn = document.getElementById("logout-btn")

  // Global variables
  let currentUserToEdit = null
  let currentUserToDelete = null
  let allUsers = []

  // Initialize the admin dashboard
  initAdminDashboard()

  // Event Listeners
  addUserBtn.addEventListener("click", () => (addUserModal.style.display = "block"))

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      addUserModal.style.display = "none"
      editUserModal.style.display = "none"
      deleteUserModal.style.display = "none"
    })
  })

  window.addEventListener("click", (event) => {
    if (event.target === addUserModal) addUserModal.style.display = "none"
    if (event.target === editUserModal) editUserModal.style.display = "none"
    if (event.target === deleteUserModal) deleteUserModal.style.display = "none"
  })

  addUserForm.addEventListener("submit", handleAddUser)
  editUserForm.addEventListener("submit", handleEditUser)
  document.getElementById("confirm-delete").addEventListener("click", handleDeleteUser)
  document.getElementById("cancel-delete").addEventListener("click", () => {
    deleteUserModal.style.display = "none"
  })

  searchBtn.addEventListener("click", filterUsers)
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") filterUsers()
  })

  roleFilter.addEventListener("change", filterUsers)
  statusFilter.addEventListener("change", filterUsers)

  logoutBtn.addEventListener("click", handleLogout)

  // Navigation
  document.querySelectorAll("[data-page]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      showPage(e.target.getAttribute("data-page"))
    })
  })

  // Functions
  async function initAdminDashboard() {
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "login.html"
      return
    }

    try {
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token")
          window.location.href = "login.html"
          return
        }
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      if (!data.success) throw new Error(data.message || "Failed to fetch users")

      allUsers = data.users
      renderUsers(allUsers)

      // Display current user info
      if (data.currentUser) {
        document.querySelector(".profile-img").alt = data.currentUser.name
        document.querySelector(".user-name").textContent = data.currentUser.name
        document.querySelector(".user-role").textContent = data.currentUser.role
      }
    } catch (error) {
      console.error("Error initializing dashboard:", error)
      showAlert(`Failed to load dashboard: ${error.message}`, "error")
    }
  }

  function renderUsers(users) {
    usersTableBody.innerHTML = ""

    if (users.length === 0) {
      usersTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>'
      return
    }

    users.forEach((user) => {
      const row = document.createElement("tr")
      row.innerHTML = `
          <td>${user._id}</td>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.role || "customer"}</td>
          <td><span class="status-badge ${user.isVerified ? "active" : "inactive"}">
            ${user.isVerified ? "Active" : "Inactive"}
          </span></td>
          <td>${new Date(user.createdAt).toLocaleDateString()}</td>
          <td class="actions">
            <button class="btn btn-sm btn-edit" data-id="${user._id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-delete" data-id="${user._id}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `
      usersTableBody.appendChild(row)
    })

    // Add event listeners to edit and delete buttons
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        openEditModal(e.currentTarget.getAttribute("data-id"))
      })
    })

    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        openDeleteModal(e.currentTarget.getAttribute("data-id"))
      })
    })
  }

  async function openEditModal(userId) {
    const user = allUsers.find((u) => u._id === userId)
    if (!user) return

    currentUserToEdit = user

    document.getElementById("edit-user-id").value = user._id
    document.getElementById("edit-user-name").value = user.name
    document.getElementById("edit-user-email").value = user.email

    // Set role and status
    document.querySelector(`input[name="edit-user-role"][value="${user.role || "customer"}"]`).checked = true
    document.querySelector(
      `input[name="edit-user-status"][value="${user.isVerified ? "active" : "inactive"}"]`,
    ).checked = true

    editUserModal.style.display = "block"
  }

  async function openDeleteModal(userId) {
    const user = allUsers.find((u) => u._id === userId)
    if (!user) return

    currentUserToDelete = user
    document.getElementById("delete-user-name").textContent = user.name
    document.getElementById("delete-user-email").textContent = user.email
    deleteUserModal.style.display = "block"
  }

  async function handleAddUser(e) {
    e.preventDefault()

    const formData = {
      name: document.getElementById("new-user-name").value,
      email: document.getElementById("new-user-email").value,
      password: document.getElementById("new-user-password").value,
      role: document.querySelector('input[name="new-user-role"]:checked').value,
      isVerified: document.querySelector('input[name="new-user-status"]:checked').value === "active",
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.message || "Failed to add user")

      await initAdminDashboard()
      addUserModal.style.display = "none"
      addUserForm.reset()
      showAlert("User added successfully!", "success")
    } catch (error) {
      showAlert(error.message || "Failed to add user", "error")
    }
  }

  async function handleEditUser(e) {
    e.preventDefault()

    const formData = {
      id: document.getElementById("edit-user-id").value,
      name: document.getElementById("edit-user-name").value,
      email: document.getElementById("edit-user-email").value,
      password: document.getElementById("edit-user-password").value,
      role: document.querySelector('input[name="edit-user-role"]:checked').value,
      isVerified: document.querySelector('input[name="edit-user-status"]:checked').value === "active",
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/users/${formData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.message || "Failed to update user")

      await initAdminDashboard()
      editUserModal.style.display = "none"
      showAlert("User updated successfully!", "success")
    } catch (error) {
      showAlert(error.message || "Failed to update user", "error")
    }
  }

  async function handleDeleteUser() {
    if (!currentUserToDelete) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/users/${currentUserToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.message || "Failed to delete user")

      await initAdminDashboard()
      deleteUserModal.style.display = "none"
      showAlert("User deleted successfully!", "success")
    } catch (error) {
      showAlert(error.message || "Failed to delete user", "error")
    }
  }

  function filterUsers() {
    const searchTerm = searchInput.value.toLowerCase()
    const roleFilterValue = roleFilter.value
    const statusFilterValue = statusFilter.value

    const filteredUsers = allUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm)
      const matchesRole = roleFilterValue === "all" || (user.role || "customer") === roleFilterValue
      const matchesStatus =
        statusFilterValue === "all" || (statusFilterValue === "active" ? user.isVerified : !user.isVerified)

      return matchesSearch && matchesRole && matchesStatus
    })

    renderUsers(filteredUsers)
  }

  function showPage(page) {
    document.querySelectorAll(".admin-section").forEach((section) => {
      section.classList.remove("active")
    })
    document.getElementById(page).classList.add("active")

    document.querySelectorAll("[data-page]").forEach((link) => {
      link.classList.remove("active")
    })
    document.querySelector(`[data-page="${page}"]`).classList.add("active")
  }

  function showAlert(message, type) {
    const existingAlert = document.querySelector(".alert")
    if (existingAlert) existingAlert.remove()

    const alert = document.createElement("div")
    alert.className = `alert alert-${type}`
    alert.textContent = message
    document.querySelector(".admin-header").appendChild(alert)

    setTimeout(() => alert.remove(), 3000)
  }

  function handleLogout() {
    localStorage.removeItem("token")
    window.location.href = "login.html"
  }
})
