// =========================================================
// TASK CREATION FORM MANAGER
// Handles opening the modal, creating tasks, filters,
// and complete-all functionality.
// =========================================================

import { renderTask, loadTasks } from "./taskComponent.js";
import { getCurrentWeatherCondition } from "./weather.js";
import { showTaskSuccess } from "./toast.js";

// ---------------------------------------------------------
// DOM REFERENCES (SAFE)
// ---------------------------------------------------------
const addTaskBtn = document.getElementById("addTask");
const taskGrd = document.getElementById("taskGrd");
const taskCount = document.querySelector(".panel-sub");

// Buttons (use IDs, NOT children indexes)
const completeAllBtn = document.getElementById("completeAllBtn");
const filterBtn = document.getElementById("toggleCompletedBtn");

// Filter state: "all" | "completed" | "incompleted"
let currentFilter = "all";

// ---------------------------------------------------------
// OPEN TASK CREATION MODAL
// ---------------------------------------------------------
if (addTaskBtn) {
    addTaskBtn.addEventListener("click", openTaskCreationForm);
}

/**
 * Loads and displays the task creation form modal.
 */
export function openTaskCreationForm() {
    fetch("./Components/taskCreationForm.html")
        .then(res => res.text())
        .then(html => {
            const modalWrapper = document.createElement("div");
            modalWrapper.innerHTML = html;
            document.body.appendChild(modalWrapper);

            const modal = modalWrapper.querySelector(".task-modal-bg");
            const closeBtn = modal.querySelector(".close-form");
            const submitBtn = modal.querySelector(".create-task-btn");

            closeBtn.addEventListener("click", () => modalWrapper.remove());

            submitBtn.addEventListener("click", event => {
                event.preventDefault();
                createNewTask(modalWrapper);
            });
        });
}

// ---------------------------------------------------------
// CREATE NEW TASK
// ---------------------------------------------------------
function createNewTask(wrapper) {
    const modal = wrapper.querySelector(".task-modal-bg");

    const name = modal.querySelector("#taskName").value.trim();
    const desc = modal.querySelector("#taskDesc").value.trim();
    const date = modal.querySelector("#taskDate").value.trim();

    if (!name) return alert("Task name cannot be empty.");
    if (!date) return alert("Please select a valid date.");

    const weatherAtCreation = getCurrentWeatherCondition();

    const newTask = {
        id: crypto.randomUUID(),
        name,
        desc,
        date,
        completed: false,
        weather: weatherAtCreation
    };

    saveTask(newTask);
    renderTask(newTask);
    updateTaskCount();

    wrapper.remove();
    showTaskSuccess("Task created successfully!");
}

// ---------------------------------------------------------
// SAVE TASK
// ---------------------------------------------------------
function saveTask(task) {
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    tasks.push(task);

    tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ---------------------------------------------------------
// UPDATE COUNTER
// ---------------------------------------------------------
export function updateTaskCount() {
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    taskCount.textContent = `You have ${tasks.length} tasks planned for today`;
}

// ---------------------------------------------------------
// COMPLETE ALL
// ---------------------------------------------------------
if (completeAllBtn) {
    completeAllBtn.addEventListener("click", completeAllTasks);
}

function completeAllTasks() {
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    tasks.forEach(task => (task.completed = true));

    localStorage.setItem("tasks", JSON.stringify(tasks));
    loadTasks();
    updateTaskCount();

    showTaskSuccess("All tasks completed!");
}

// ---------------------------------------------------------
// FILTER: Completed / Incompleted / All
// ---------------------------------------------------------
if (filterBtn) {
    filterBtn.addEventListener("click", toggleFilterMode);
}

function toggleFilterMode() {
    if (currentFilter === "all") {
        currentFilter = "completed";
        filterBtn.textContent = "Show Incompleted";
    } else if (currentFilter === "completed") {
        currentFilter = "incompleted";
        filterBtn.textContent = "Show All";
    } else {
        currentFilter = "all";
        filterBtn.textContent = "Show Completed";
    }

    applyFilter();
}

function applyFilter() {
    const cards = document.querySelectorAll(".task-card-advanced");

    cards.forEach(card => {
        const isCompleted = card.classList.contains("task-completed");

        if (currentFilter === "completed") {
            card.style.display = isCompleted ? "block" : "none";
        } else if (currentFilter === "incompleted") {
            card.style.display = isCompleted ? "none" : "block";
        } else {
            card.style.display = "block";
        }
    });
}
