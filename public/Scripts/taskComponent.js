/**
 * TASK COMPONENT
 * - Renders task cards
 * - Handles interactions:
 *   - Toggle complete
 *   - Delete
 *   - Edit (modal)
 * - Applies weather filters (multi-select)
 */

import { showTaskSuccess, showTaskError } from "./toast.js";
import { loadSuggestedTasks } from "./suggestedTaskComponent.js";

// ---------------------------------------------------------
// WEATHER FILTER STATE (multi-select)
// Default: all enabled
// ---------------------------------------------------------
let activeWeatherFilters = new Set(["sunny", "cloudy", "rainy"]);

// ---------------------------------------------------------
// EDIT MODAL STATE
// ---------------------------------------------------------
let editingTaskId = null;

// ---------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------
export function initTaskEventHandlers() {
    document.body.addEventListener("click", handleTaskClick);
    initEditModalHandlers();
}

// ---------------------------------------------------------
// RENDER TASK CARD (used by Suggested Tasks too)
// ---------------------------------------------------------
export function renderTaskCard(task) {
    const grid = document.getElementById("taskGrd");
    if (!grid) return;

    const card = document.createElement("div");
    card.className = "task-card-advanced shadow-sm";
    card.dataset.id = task._id;
    card.dataset.weather = task.weather;

    if (task.completed) {
        card.classList.add("task-completed");
    }

    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <h6 class="task-title-adv">${escapeHTML(task.name)}</h6>
                <p class="task-duration-adv">${escapeHTML(task.desc || "")}</p>
            </div>

            <div class="task-main-icon">
                ${getWeatherIcon(task.weather)}
            </div>
        </div>

        <h3 class="task-time-adv">${escapeHTML(task.date)}</h3>

        <div class="based-on-wrapper d-flex justify-content-between align-items-center mt-3">
            <div class="task-check-adv" title="Toggle complete">
                <i class="bi ${task.completed ? "bi-check-circle-fill" : "bi-check-circle"}"></i>
            </div>

            <button class="task-delete-btn" type="button" title="Delete task">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;

    grid.appendChild(card);
    applyTaskFilters();
}

// ---------------------------------------------------------
// CLICK HANDLER (event delegation)
// ---------------------------------------------------------
async function handleTaskClick(e) {
    const card = e.target.closest(".task-card-advanced");
    if (!card) return;

    const id = card.dataset.id;

    if (e.target.closest(".task-check-adv")) {
        await toggleTaskCompletion(id, card);
        return;
    }

    if (e.target.closest(".task-delete-btn")) {
        await deleteTask(id, card);
        return;
    }

    openEditModalFromCard(card);
}

// ---------------------------------------------------------
// TASK ACTIONS
// ---------------------------------------------------------
async function toggleTaskCompletion(id, card) {
    try {
        const res = await fetch(`/tasks/${id}`, { method: "PATCH" });

        if (res.status === 401) {
            showTaskError("Please log in to manage tasks");
            return;
        }

        if (!res.ok) throw new Error("Toggle failed");

        const wasCompleted = card.classList.contains("task-completed");

        // Toggle state
        card.classList.toggle("task-completed");

        // Move between grids
        if (!wasCompleted) {
            // moved to completed
            document.getElementById("completedTaskGrd")?.appendChild(card);
        } else {
            // moved back to backlog
            document.getElementById("taskGrd")?.appendChild(card);
        }


        const icon = card.querySelector(".task-check-adv i");
        icon.className = `bi ${card.classList.contains("task-completed")
            ? "bi-check-circle-fill"
            : "bi-check-circle"}`;

        showTaskSuccess("Task updated");

        loadSuggestedTasks();
        applyTaskFilters();

        window.updateTaskCounter?.();
        window.updateCompleteAllVisibility?.();
        document.dispatchEvent(new CustomEvent("tasks:updated"));

    } catch (err) {
        console.error(err);
        showTaskError("Failed to update task");
    }
}

async function deleteTask(id, card) {
    try {
        const res = await fetch(`/tasks/${id}`, { method: "DELETE" });

        if (res.status === 401) {
            showTaskError("Please log in to manage tasks");
            return;
        }

        if (!res.ok) throw new Error("Delete failed");

        card.remove();
        showTaskSuccess("Task deleted");

        loadSuggestedTasks();
        applyTaskFilters();

        window.updateTaskCounter?.();
        window.updateCompleteAllVisibility?.();

    } catch (err) {
        console.error(err);
        showTaskError("Failed to delete task");
    }
}

// ---------------------------------------------------------
// EDIT MODAL
// ---------------------------------------------------------
function initEditModalHandlers() {
    const editNameEl = document.getElementById("editTaskName");
    const editDescEl = document.getElementById("editTaskDesc");
    const editDateEl = document.getElementById("editTaskDate");

    if (!editNameEl || !editDescEl || !editDateEl) return;

    const modalBg = editNameEl.closest(".task-modal-bg");
    const form = editNameEl.closest("form");
    const closeBtn = modalBg?.querySelector(".close-form");

    closeBtn?.addEventListener("click", () => closeEditModal(modalBg));

    modalBg?.addEventListener("click", e => {
        if (e.target === modalBg) closeEditModal(modalBg);
    });

    form?.addEventListener("submit", async e => {
        e.preventDefault();
        if (!editingTaskId) return;

        const name = editNameEl.value.trim();
        const desc = editDescEl.value.trim();
        const date = editDateEl.value;

        if (!name || !date) {
            showTaskError("Name and date are required");
            return;
        }

        try {
            const res = await fetch(`/tasks/${editingTaskId}/edit`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, desc, date })
            });

            if (!res.ok) throw new Error("Edit failed");

            const updated = await res.json();
            const card = document.querySelector(`.task-card-advanced[data-id="${editingTaskId}"]`);

            if (card) {
                card.querySelector(".task-title-adv").textContent = updated.name;
                card.querySelector(".task-duration-adv").textContent = updated.desc || "";
                card.querySelector(".task-time-adv").textContent = updated.date;
            }

            showTaskSuccess("Task updated");
            closeEditModal(modalBg);

            loadSuggestedTasks();
            applyTaskFilters();
            window.updateTaskCounter?.();

        } catch (err) {
            console.error(err);
            showTaskError("Failed to edit task");
        }
    });
}

function openEditModalFromCard(card) {
    const editNameEl = document.getElementById("editTaskName");
    const editDescEl = document.getElementById("editTaskDesc");
    const editDateEl = document.getElementById("editTaskDate");
    if (!editNameEl || !editDescEl || !editDateEl) return;

    const modalBg = editNameEl.closest(".task-modal-bg");
    if (!modalBg) return;

    editingTaskId = card.dataset.id;

    editNameEl.value = card.querySelector(".task-title-adv")?.textContent || "";
    editDescEl.value = card.querySelector(".task-duration-adv")?.textContent || "";
    editDateEl.value = card.querySelector(".task-time-adv")?.textContent || "";

    modalBg.classList.remove("d-none");
}

function closeEditModal(modalBg) {
    editingTaskId = null;
    modalBg?.classList.add("d-none");
}

// ---------------------------------------------------------
// WEATHER FILTERS
// ---------------------------------------------------------
export function setWeatherTaskFilter(weather) {
    if (activeWeatherFilters.has(weather)) {
        activeWeatherFilters.delete(weather);
    } else {
        activeWeatherFilters.add(weather);
    }

    updateFilterButtons();
    applyTaskFilters();
}

export function applyTaskFilters() {
    document.querySelectorAll(".task-card-advanced").forEach(card => {
        const weather = card.dataset.weather;
        const isCompleted = card.classList.contains("task-completed");

        if (window.completedOnly && !isCompleted) {
            card.classList.add("d-none");
            return;
        }

        if (!activeWeatherFilters.has(weather)) {
            card.classList.add("d-none");
            return;
        }

        card.classList.remove("d-none");
    });
}

// ---------------------------------------------------------
// UI HELPERS
// ---------------------------------------------------------
function updateFilterButtons() {
    document.querySelectorAll(".weather-filter-btn").forEach(btn => {
        btn.classList.toggle("active", activeWeatherFilters.has(btn.dataset.weather));
    });
}

function getWeatherIcon(weather) {
    if (weather === "rainy") return `<i class="bi bi-cloud-rain"></i>`;
    if (weather === "cloudy") return `<i class="bi bi-cloud"></i>`;
    return `<i class="bi bi-brightness-high"></i>`;
}

function escapeHTML(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
