// =========================================================
// TASK COMPONENT MANAGER
// Includes: render, toggle complete, delete, edit modal
// =========================================================

import { updateTaskCount } from "./taskCreationForm.js";
import { showTaskSuccess } from "./toast.js";

let currentWeatherFilter = "all";

const taskGrd = document.getElementById("taskGrd");

export function loadTasks() {
    taskGrd.innerHTML = "";
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");

    const filteredTasks = tasks.filter(task => {
        if (currentWeatherFilter === "all") return true;
        return task.weather === currentWeatherFilter;
    });

    filteredTasks
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach(task => renderTask(task));
}


export function renderTask(task) {
    fetch("./Components/taskComponent.html")
        .then(res => res.text())
        .then(html => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = html.trim();
            const card = wrapper.firstElementChild;

            const deleteBtn = card.querySelector(".task-delete-btn");
            const checkIcon = card.querySelector(".task-check-adv i");
            const title = card.querySelector(".task-title-adv");
            const desc = card.querySelector(".task-duration-adv");
            const date = card.querySelector(".task-time-adv");
            const weatherIcon = card.querySelector(".task-main-icon i");

            // Apply weather icon stored in the task
            applyTaskWeatherIcon(weatherIcon, task.weather);

            title.innerText = task.name;
            desc.innerText = task.desc;
            date.innerText = task.date;

            // Completed state
            if (task.completed) {
                card.classList.add("task-completed");
                checkIcon.classList.remove("bi-check-circle");
                checkIcon.classList.add("bi-check-circle-fill");
            }

            // Prevent clicking on delete/check from opening edit modal
            deleteBtn.addEventListener("click", e => {
                e.stopPropagation();
                deleteTask(task.id);
            });

            checkIcon.addEventListener("click", e => {
                e.stopPropagation();
                toggleTaskCompletion(task.id, card, checkIcon);
            });

            // OPEN EDIT MODAL ON CLICK ANYWHERE ELSE
            card.addEventListener("click", () => openEditTaskModal(task));

            taskGrd.prepend(card);
        });
}

// ---------------------------------------------------------
// EDIT TASK MODAL
// ---------------------------------------------------------

function openEditTaskModal(task) {
    fetch("./Components/editTaskForm.html")
        .then(res => res.text())
        .then(html => {
            const wrap = document.createElement("div");
            wrap.innerHTML = html;
            document.body.appendChild(wrap);

            const modal = wrap.querySelector(".task-modal-bg");
            const closeBtn = modal.querySelector(".close-form");

            const nameInput = modal.querySelector("#editTaskName");
            const descInput = modal.querySelector("#editTaskDesc");
            const dateInput = modal.querySelector("#editTaskDate");
            const saveBtn = modal.querySelector(".create-task-btn");

            // Prefill values
            nameInput.value = task.name;
            descInput.value = task.desc;
            dateInput.value = task.date;

            closeBtn.addEventListener("click", () => modal.remove());

            saveBtn.addEventListener("click", e => {
                e.preventDefault();
                saveEditedTask(task.id, nameInput.value, descInput.value, dateInput.value);
                modal.remove();
            });
        });
}

function saveEditedTask(id, newName, newDesc, newDate) {
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    const task = tasks.find(t => t.id === id);

    if (!task) return;

    task.name = newName;
    task.desc = newDesc;
    task.date = newDate;

    localStorage.setItem("tasks", JSON.stringify(tasks));

    loadTasks();
    updateTaskCount();
    showTaskSuccess("Task updated successfully!");
}

// ---------------------------------------------------------
// TOGGLE COMPLETED
// ---------------------------------------------------------

function toggleTaskCompletion(id, card, icon) {
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    const task = tasks.find(t => t.id === id);

    task.completed = !task.completed;

    if (task.completed) {
        icon.classList.remove("bi-check-circle");
        icon.classList.add("bi-check-circle-fill");
        card.classList.add("task-completed");
    } else {
        icon.classList.add("bi-check-circle");
        icon.classList.remove("bi-check-circle-fill");
        card.classList.remove("task-completed");
    }

    localStorage.setItem("tasks", JSON.stringify(tasks));
    showTaskSuccess(task.completed ? "Task completed!" : "Task marked incomplete.");
}

// ---------------------------------------------------------
// DELETE TASK
// ---------------------------------------------------------

export function deleteTask(id) {
    let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    tasks = tasks.filter(t => t.id !== id);

    localStorage.setItem("tasks", JSON.stringify(tasks));
    loadTasks();
    updateTaskCount();
    showTaskSuccess("Task deleted successfully!");
}

function applyTaskWeatherIcon(iconEl, weather) {
    if (!iconEl) return;

    if (weather === "rainy") {
        iconEl.className = "bi bi-cloud-rain";
    } else if (weather === "cloudy") {
        iconEl.className = "bi bi-cloud";
    } else {
        iconEl.className = "bi bi-brightness-high";
    }
}

export function setWeatherTaskFilter(filter) {
    currentWeatherFilter = filter;
    loadTasks();
}
