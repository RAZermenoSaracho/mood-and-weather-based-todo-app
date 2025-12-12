import "./moodSelecterForm.js";
import "./taskCreationForm.js";

import { loadTasks, setWeatherTaskFilter } from "./taskComponent.js";
import { loadSuggestedTasks } from "./suggestedTaskComponent.js";
import { updateTaskCount } from "./taskCreationForm.js";
import { initUserFromStorage } from "./loginForm.js";

document.addEventListener("DOMContentLoaded", async () => {

    const mobileToggle = document.getElementById("mobileActionsToggle");
    const taskActions = document.querySelector(".task-actions");

    if (mobileToggle && taskActions) {
        mobileToggle.addEventListener("click", () => {
            taskActions.classList.toggle("is-open");
        });
    }

    await initUserFromStorage();
    loadTasks();
    loadSuggestedTasks();
    updateTaskCount();

    document.querySelectorAll(".weather-filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            setWeatherTaskFilter(btn.dataset.weather);
        });
    });
});
