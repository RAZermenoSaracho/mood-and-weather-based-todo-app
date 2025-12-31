/**
 * TASK CREATION FORM (MongoDB + Handlebars)
 * - Opens / closes the creation modal
 * - Validates auth
 * - Sends task data to backend
 * - Does NOT manage filters, counters or rendering
 */

import { getCurrentWeatherCondition } from "./weather.js";
import { showTaskSuccess } from "./toast.js";

// ---------------------------------------------------------
// DOM REFERENCES
// ---------------------------------------------------------
const addTaskBtn = document.getElementById("addTask");
const taskModal = document.getElementById("taskCreationModal");
const createTaskForm = document.getElementById("createTaskForm");

// ---------------------------------------------------------
// OPEN TASK MODAL (OR LOGIN)
// ---------------------------------------------------------
if (addTaskBtn && taskModal) {
    addTaskBtn.addEventListener("click", async () => {
        try {
            const me = await fetch("/auth/me").then(r => r.json());

            // Not logged in → open login modal
            if (!me) {
                document
                    .getElementById("loginModal")
                    ?.classList.remove("d-none");
                return;
            }

            // Logged in → open task modal
            taskModal.classList.remove("d-none");

        } catch (err) {
            console.error("Auth check failed:", err);
        }
    });
}

// ---------------------------------------------------------
// CLOSE TASK MODAL
// ---------------------------------------------------------
if (taskModal) {
    taskModal.addEventListener("click", (e) => {
        if (
            e.target.classList.contains("task-modal-bg") ||
            e.target.classList.contains("close-form")
        ) {
            taskModal.classList.add("d-none");
        }
    });
}

// ---------------------------------------------------------
// CREATE TASK
// ---------------------------------------------------------
if (createTaskForm) {
    createTaskForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Double safety check
        const me = await fetch("/auth/me").then(r => r.json());
        if (!me) {
            document
                .getElementById("loginModal")
                ?.classList.remove("d-none");
            return;
        }

        const name = createTaskForm.taskName.value.trim();
        const desc = createTaskForm.taskDesc.value.trim();
        const date = createTaskForm.taskDate.value;

        if (!name || !date) {
            alert("Task name and date are required.");
            return;
        }

        const weather = getCurrentWeatherCondition();

        try {
            const res = await fetch("/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, desc, date, weather })
            });

            if (!res.ok) {
                throw new Error("Failed to create task");
            }

            showTaskSuccess("Task created successfully!");

            // Close modal
            taskModal.classList.add("d-none");

            const createdTask = await res.json();

            // Render new task immediately
            import("./taskComponent.js").then(m => {
                m.renderTaskCard(createdTask);
                document.dispatchEvent(new CustomEvent("tasks:updated"));
            });

        } catch (err) {
            console.error(err);
            alert("Error creating task.");
        }
    });
}
