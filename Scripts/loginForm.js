// =========================================================
// LOGIN / PROFILE MANAGER
// =========================================================

import { initWeather } from "./weather.js";
import { loadSuggestedTasks } from "./suggestedTaskComponent.js";
import { showTaskSuccess } from "./toast.js";

const profileBtn = document.getElementById("profileBtn");
const guestText = document.querySelector(".guest-text");

// ---------------------------------------------------------
// GET USER FROM STORAGE
// ---------------------------------------------------------
export function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("userProfile")) || null;
    } catch {
        return null;
    }
}

// ---------------------------------------------------------
// INITIAL LOAD — SET NAME + WEATHER
// ---------------------------------------------------------
export async function initUserFromStorage() {
    const user = getStoredUser();
    const savedName = user?.name || "Guest";
    const savedLocation = user?.location || null;

    // Pídele al módulo de weather que resuelva:
    // - usar location si existe
    // - probar GPS si no hay
    // - usar Mexico City en el peor caso
    const finalLocation = await initWeather(savedLocation);

    updateNavbarName(savedName, finalLocation);
}

// ---------------------------------------------------------
// OPEN LOGIN / EDIT MODAL
// ---------------------------------------------------------
if (profileBtn) {
    profileBtn.addEventListener("click", openProfileModal);
}

function openProfileModal() {
    fetch("./Components/loginForm.html")
        .then(res => res.text())
        .then(html => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = html;
            document.body.appendChild(wrapper);

            const modal = wrapper.querySelector(".login-modal-container");
            const closeBtn = modal.querySelector(".close-icon");
            const loginView = modal.querySelector(".login-view");
            const editView = modal.querySelector(".edit-view");
            const titleEl = modal.querySelector(".modal-title");

            const user = getStoredUser();

            if (user) {
                // EDIT PROFILE VIEW
                loginView.classList.add("d-none");
                editView.classList.remove("d-none");
                titleEl.textContent = "Edit Profile";

                modal.querySelector("#editName").value = user.name;
                modal.querySelector("#editEmail").value = user.email;
                modal.querySelector("#editPassword").value = user.password;
                modal.querySelector("#editLocation").value = user.location || "";

                modal.querySelector("#editProfileForm")
                    .addEventListener("submit", async e => {
                        e.preventDefault();
                        await handleEditProfile(modal);
                    });

                modal.querySelector("#logoutBtn")
                    .addEventListener("click", async () => {
                        await handleLogout(modal);
                    });

            } else {
                // LOGIN VIEW
                loginView.classList.remove("d-none");
                editView.classList.add("d-none");
                titleEl.textContent = "Login";

                modal.querySelector("#loginForm")
                    .addEventListener("submit", e => {
                        e.preventDefault();
                        handleLogin(modal);
                    });
            }

            closeBtn.addEventListener("click", () => modal.remove());
        });
}

// ---------------------------------------------------------
// LOGIN
// ---------------------------------------------------------
function handleLogin(modal) {
    const name = modal.querySelector("#loginName").value.trim();
    const email = modal.querySelector("#loginEmail").value.trim();
    const password = modal.querySelector("#loginPassword").value.trim();

    const errors = validateUserData(name, email, password);
    showErrors(modal, "login", errors);
    if (Object.keys(errors).length > 0) return;

    const user = { name, email, password, location: null };
    localStorage.setItem("userProfile", JSON.stringify(user));

    showTaskSuccess("Login successful!");
    modal.remove();

    initUserFromStorage();
}

// ---------------------------------------------------------
// EDIT PROFILE
// ---------------------------------------------------------
async function handleEditProfile(modal) {
    const name = modal.querySelector("#editName").value.trim();
    const email = modal.querySelector("#editEmail").value.trim();
    const password = modal.querySelector("#editPassword").value.trim();
    const location = modal.querySelector("#editLocation").value.trim() || null;

    const errors = validateUserData(name, email, password);
    showErrors(modal, "edit", errors);
    if (Object.keys(errors).length > 0) return;

    const user = { name, email, password, location };
    localStorage.setItem("userProfile", JSON.stringify(user));

    await initUserFromStorage();
    loadSuggestedTasks();

    showTaskSuccess("Profile updated!");
    modal.remove();
}

// ---------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------
async function handleLogout(modal) {
    localStorage.removeItem("userProfile");

    showTaskSuccess("Logged out!");
    modal.remove();

    await initUserFromStorage();
}

// ---------------------------------------------------------
// VALIDATION + ERRORS
// ---------------------------------------------------------
function validateUserData(name, email, password) {
    const errors = {};
    if (!name) errors.name = "Name cannot be empty.";
    if (!email || !email.includes("@")) errors.email = "Enter a valid email.";
    if (!password || password.length < 8) errors.password = "Password must be at least 8 characters.";
    return errors;
}

function showErrors(modal, mode, errors) {
    ["Name", "Email", "Password"].forEach(field => {
        const input = modal.querySelector(`#${mode}${field}`);
        const errorEl = modal.querySelector(`#${mode}${field}Error`);
        if (!input || !errorEl) return;

        if (errors[field.toLowerCase()]) {
            errorEl.textContent = errors[field.toLowerCase()];
            errorEl.classList.remove("d-none");
            input.classList.add("is-invalid");
        } else {
            errorEl.classList.add("d-none");
            input.classList.remove("is-invalid");
        }

        input.addEventListener("input", () => {
            errorEl.classList.add("d-none");
            input.classList.remove("is-invalid");
        });
    });
}

// ---------------------------------------------------------
// NAVBAR TITLE
// ---------------------------------------------------------
function updateNavbarName(name, city) {
    // city puede ser "Your location", "Mexico City", o lo que haya devuelto initWeather
    guestText.textContent = `${name}, you are in ${city}`;
}
