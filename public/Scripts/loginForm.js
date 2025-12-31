// =========================================================
// LOGIN / PROFILE MANAGER (FINAL FIXED VERSION)
// =========================================================

import { initWeather } from "./weather.js";
import { showTaskSuccess } from "./toast.js";

const guestText = document.querySelector(".guest-text");

let authMode = "login"; // "login" | "signup"

// ---------------------------------------------------------
// INIT USER SESSION
// ---------------------------------------------------------
export async function initUser() {
    try {
        const res = await fetch("/auth/me");
        const user = res.ok ? await res.json() : null;

        if (user) {
            switchToEditView(user);
            const city = await initWeather(user.location || null);
            updateNavbar(user.name, city);
        } else {
            const city = await initWeather(null);
            updateNavbar("Guest", city);
        }
    } catch (err) {
        console.warn("User session init failed:", err);
        const city = await initWeather(null);
        updateNavbar("Guest", city);
    }
}

// ---------------------------------------------------------
// MODAL OPEN / CLOSE (ROBUST)
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const profileBtn = document.getElementById("profileBtn");
    const loginModal = document.getElementById("loginModal");
    const closeIcon = loginModal?.querySelector(".close-icon");

    if (profileBtn && loginModal) {
        profileBtn.addEventListener("click", () => {
            loginModal.classList.remove("d-none");
        });
    }

    // Close with X
    if (closeIcon && loginModal) {
        closeIcon.addEventListener("click", () => {
            closeLoginModal();
        });
    }

    // Close when clicking backdrop
    if (loginModal) {
        loginModal.addEventListener("click", e => {
            if (e.target === loginModal) {
                closeLoginModal();
            }
        });
    }
});

function closeLoginModal() {
    const modal = document.getElementById("loginModal");
    if (!modal) return;
    modal.classList.add("d-none");
}

// ---------------------------------------------------------
// LOGIN / SIGNUP FORM
// ---------------------------------------------------------
const loginForm = document.getElementById("loginForm");
const submitBtn = document.getElementById("loginSubmitBtn");

const nameInput = document.getElementById("loginName");
const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");

const nameError = document.getElementById("loginNameError");
const emailError = document.getElementById("loginEmailError");
const passwordError = document.getElementById("loginPasswordError");

function clearErrors() {
    [nameError, emailError, passwordError].forEach(e => e?.classList.add("d-none"));
}

function showError(el, msg = null) {
    if (!el) return;
    if (msg) el.textContent = msg;
    el.classList.remove("d-none");
}

if (loginForm) {
    loginForm.addEventListener("submit", async e => {
        e.preventDefault();
        clearErrors();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!name) return showError(nameError);
        if (!email) return showError(emailError);
        if (!password || password.length < 8) {
            return showError(passwordError, "Password must be at least 8 characters.");
        }

        // ---------------------------
        // LOGIN
        // ---------------------------
        if (authMode === "login") {
            const res = await fetch("/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                showTaskSuccess("Welcome back!");
                window.location.reload();
                return;
            }

            const err = await res.json();

            if (err.error === "INVALID_PASSWORD") {
                showError(passwordError, "Incorrect password.");
                return;
            }

            if (err.error === "USER_NOT_FOUND") {
                authMode = "signup";
                submitBtn.textContent = "Sign up";
                showError(emailError, "User not found. You can create an account.");
                return;
            }

            showError(emailError, "Login failed.");
        }

        // ---------------------------
        // SIGNUP
        // ---------------------------
        if (authMode === "signup") {
            const res = await fetch("/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            if (!res.ok) {
                const err = await res.json();
                showError(emailError, err.error || "Registration failed.");
                return;
            }

            showTaskSuccess("Account created!");
            window.location.reload();
        }
    });
}

// ---------------------------------------------------------
// EDIT PROFILE (FIXED LOCATION FLOW)
// ---------------------------------------------------------
const editForm = document.getElementById("editProfileForm");

if (editForm) {
    editForm.addEventListener("submit", async e => {
        e.preventDefault();

        const rawLocation = document.getElementById("editLocation").value.trim();

        // Normalize location:
        // "" or "none" => null (forces browser GPS)
        const normalizedLocation =
            rawLocation === "" || rawLocation.toLowerCase() === "none"
                ? null
                : rawLocation;

        const payload = {
            name: document.getElementById("editName").value.trim(),
            email: document.getElementById("editEmail").value.trim(),
            password: document.getElementById("editPassword").value.trim(),
            location: normalizedLocation
        };

        if (!payload.name) return;

        const res = await fetch("/auth/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            showTaskError("Failed to update profile");
            return;
        }

        showTaskSuccess("Profile updated!");

        // 🔑 IMPORTANT PART:
        // Re-fetch user and re-init weather WITHOUT reload
        await initUser();

        // Close modal
        document.getElementById("loginModal")?.classList.add("d-none");
    });
}

// ---------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        await fetch("/auth/logout", { method: "POST" });
        showTaskSuccess("Logged out");
        window.location.reload();
    });
}

// ---------------------------------------------------------
// UI HELPERS
// ---------------------------------------------------------
function switchToEditView(user) {
    document.querySelector(".login-view")?.classList.add("d-none");
    document.querySelector(".edit-view")?.classList.remove("d-none");

    document.getElementById("editName").value = user.name;
    document.getElementById("editEmail").value = user.email;
    document.getElementById("editLocation").value = user.location || "";
}

function updateNavbar(name, city) {
    if (!guestText) return;
    guestText.textContent = `${name}, you are in ${city}`;
}
