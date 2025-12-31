/**
 * App entry point (MongoDB + Handlebars)
 * - Handles UI-only logic
 * - Completed-only view
 * - Weather filters
 * - Suggested tasks
 * - Task counter (single source of truth)
 */

import "./moodSelecterForm.js";
import "./taskCreationForm.js";

import {
    setWeatherTaskFilter,
    initTaskEventHandlers,
    applyTaskFilters // ✅ REQUIRED
} from "./taskComponent.js";

import { loadSuggestedTasks } from "./suggestedTaskComponent.js";
import { initUser } from "./loginForm.js";

// ---------------------------------------------------------
// DOM REFERENCES
// ---------------------------------------------------------
const taskGrd = document.getElementById("taskGrd");
const completedSection = document.getElementById("completedSection");
const toggleCompletedBtn = document.getElementById("toggleCompletedBtn");
const completeAllBtn = document.getElementById("completeAllBtn");
const counterEl = document.getElementById("taskCounter");

// ---------------------------------------------------------
// GLOBAL UI STATE (shared)
// ---------------------------------------------------------
window.completedOnly = false;

// ---------------------------------------------------------
// COMPLETE ALL
// ---------------------------------------------------------
if (completeAllBtn) {
    completeAllBtn.addEventListener("click", async () => {
        try {
            const res = await fetch("/tasks/complete-all", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) throw new Error("Failed to complete all tasks");

            // Remove all pending tasks from backlog
            // Move all pending tasks to completed grid
            document
                .querySelectorAll("#taskGrd .task-card-advanced")
                .forEach(card => {
                    // Mark as completed
                    card.classList.add("task-completed");

                    // Update icon
                    const icon = card.querySelector(".task-check-adv i");
                    if (icon) {
                        icon.className = "bi bi-check-circle-fill";
                    }

                    // Move to completed grid
                    document.getElementById("completedTaskGrd")?.appendChild(card);
                });

            // Re-sync UI
            loadSuggestedTasks();
            document.dispatchEvent(new CustomEvent("tasks:updated"));

        } catch (err) {
            console.error(err);
        }
    });
}

// ---------------------------------------------------------
// HELPERS (EXPOSED GLOBALLY)
// ---------------------------------------------------------

window.updateCompleteAllVisibility = function () {
    if (!completeAllBtn) return;

    const pendingTasks = document.querySelectorAll(
        "#taskGrd .task-card-advanced:not(.task-completed)"
    );

    const shouldShow =
        pendingTasks.length > 0 && !window.completedOnly;

    completeAllBtn.classList.toggle("d-none", !shouldShow);
};

window.updateTaskCounter = function () {
    if (!counterEl) return;

    const selector = window.completedOnly
        ? "#completedTaskGrd .task-card-advanced"
        : "#taskGrd .task-card-advanced";

    const visibleTasks = Array.from(
        document.querySelectorAll(selector)
    ).filter(card => !card.classList.contains("d-none"));

    const count = visibleTasks.length;

    counterEl.textContent = window.completedOnly
        ? `You have ${count} completed task${count === 1 ? "" : "s"}`
        : `You have ${count} pending task${count === 1 ? "" : "s"}`;
};

// ---------------------------------------------------------
// INIT
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    await initUser();

    // -----------------------------
    // Completed-only toggle
    // -----------------------------
    if (toggleCompletedBtn) {
        toggleCompletedBtn.addEventListener("click", () => {
            completedOnly = !completedOnly;

            taskGrd.classList.toggle("d-none", completedOnly);
            completedSection.classList.toggle("d-none", !completedOnly);

            toggleCompletedBtn.classList.toggle("active", completedOnly);

            document.dispatchEvent(new CustomEvent("tasks:updated"));
        });

    }

    // -----------------------------
    // Mobile actions toggle
    // -----------------------------
    const mobileToggle = document.getElementById("mobileActionsToggle");
    const taskActions = document.querySelector(".task-actions");

    if (mobileToggle && taskActions) {
        mobileToggle.addEventListener("click", () => {
            taskActions.classList.toggle("is-open");
        });
    }

    // -----------------------------
    // Init task interactions
    // -----------------------------
    initTaskEventHandlers();

    // -----------------------------
    // Suggested tasks
    // -----------------------------
    loadSuggestedTasks();

    // -----------------------------
    // Weather filter buttons
    // -----------------------------
    document.querySelectorAll(".weather-filter-btn").forEach(btn => {
        btn.classList.add("active");

        btn.addEventListener("click", () => {
            setWeatherTaskFilter(btn.dataset.weather);
            // applyTaskFilters();
            window.updateTaskCounter();
        });
    });

    window.updateTaskCounter();
    window.updateCompleteAllVisibility();
});

// ---------------------------------------------------------
// GLOBAL TASK SYNC
// ---------------------------------------------------------
function syncTasksUI() {
    applyTaskFilters?.();
    updateTaskCounter?.();
    updateCompleteAllVisibility?.();
}

// Listen to all task changes
document.addEventListener("tasks:updated", syncTasksUI);

// ---------------------------------------------------------
// GLOBAL TASKS UPDATED EVENT
// ---------------------------------------------------------
document.addEventListener("tasks:updated", () => {
    window.updateTaskCounter();
    window.updateCompleteAllVisibility();
});