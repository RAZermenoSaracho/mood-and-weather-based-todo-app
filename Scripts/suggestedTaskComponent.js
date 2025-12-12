// =========================================================
// SUGGESTED TASK SYSTEM — mood + weather (AND logic)
// =========================================================

import { renderTask } from "./taskComponent.js";
import { updateTaskCount } from "./taskCreationForm.js";
import { getCurrentWeatherCondition } from "./weather.js";

// Panel for suggested tasks
const suggestedPanel = document.querySelector(".suggested-panel");

// ---------------------------------------------------------
// SUGGESTED TASK DATABASE (RULE-BASED)
// ---------------------------------------------------------
const suggestedTasksDB = [
    /* ---------- SUNNY ---------- */

    {
        name: "Go for a walk",
        desc: "15 minutes",
        reason: "Mood: Happy & good weather",
        moods: ["happy"],
        weathers: ["sunny"]
    },
    {
        name: "Short run",
        desc: "15 minutes",
        reason: "Sunny motivation",
        moods: ["happy", "neutral"],
        weathers: ["sunny"]
    },
    {
        name: "Go outside",
        desc: "20 minutes",
        reason: "Beautiful weather",
        moods: ["neutral", "happy"],
        weathers: ["sunny"]
    },
    {
        name: "Stretching session",
        desc: "10 minutes",
        reason: "Light movement under the sun",
        moods: ["neutral", "happy"],
        weathers: ["sunny"]
    },
    {
        name: "Morning sunlight break",
        desc: "5 minutes",
        reason: "Boost your energy",
        moods: ["sad", "neutral"],
        weathers: ["sunny"]
    },
    {
        name: "Listen to music outdoors",
        desc: "15 minutes",
        reason: "Enjoy the sunny vibe",
        moods: ["happy"],
        weathers: ["sunny"]
    },

    /* ---------- CLOUDY ---------- */

    {
        name: "Read a book",
        desc: "20 minutes",
        reason: "Cloudy day activity",
        moods: ["neutral", "sad"],
        weathers: ["cloudy"]
    },
    {
        name: "Organize workspace",
        desc: "10 minutes",
        reason: "Feeling productive",
        moods: ["happy", "neutral"],
        weathers: ["cloudy", "sunny"]
    },
    {
        name: "Write a short journal entry",
        desc: "10 minutes",
        reason: "Clear your mind",
        moods: ["neutral", "sad"],
        weathers: ["cloudy"]
    },
    {
        name: "Plan weekly goals",
        desc: "15 minutes",
        reason: "Structured thinking",
        moods: ["neutral"],
        weathers: ["cloudy"]
    },
    {
        name: "Watch an educational video",
        desc: "20 minutes",
        reason: "Learn something new",
        moods: ["neutral", "happy"],
        weathers: ["cloudy"]
    },
    {
        name: "Inbox cleanup",
        desc: "10 minutes",
        reason: "Reduce digital clutter",
        moods: ["neutral"],
        weathers: ["cloudy"]
    },

    /* ---------- RAINY ---------- */

    {
        name: "Hot tea + reading",
        desc: "20 minutes",
        reason: "Rainy day mood",
        moods: ["sad", "neutral"],
        weathers: ["rainy"]
    },
    {
        name: "Clean your room",
        desc: "15 minutes",
        reason: "Indoor activity",
        moods: ["neutral", "sad"],
        weathers: ["rainy", "cloudy"]
    },
    {
        name: "Meditation",
        desc: "10 minutes",
        reason: "Calm your mind",
        moods: ["sad", "neutral"],
        weathers: ["rainy"]
    },
    {
        name: "Light indoor workout",
        desc: "15 minutes",
        reason: "Move despite the rain",
        moods: ["neutral", "happy"],
        weathers: ["rainy"]
    },
    {
        name: "Watch a comfort show",
        desc: "30 minutes",
        reason: "Cozy rainy moment",
        moods: ["sad"],
        weathers: ["rainy"]
    },
    {
        name: "Cook something warm",
        desc: "30 minutes",
        reason: "Comfort food time",
        moods: ["neutral", "happy"],
        weathers: ["rainy"]
    },

    /* ---------- UNIVERSAL / FLEXIBLE ---------- */

    {
        name: "Plan your next day",
        desc: "10 minutes",
        reason: "Neutral planning",
        moods: ["neutral"],
        weathers: ["sunny", "cloudy", "rainy"]
    },
    {
        name: "Review your goals",
        desc: "10 minutes",
        reason: "Stay on track",
        moods: ["neutral", "happy"],
        weathers: ["sunny", "cloudy"]
    },
    {
        name: "Deep breathing exercise",
        desc: "5 minutes",
        reason: "Reset your focus",
        moods: ["sad", "neutral"],
        weathers: ["sunny", "cloudy", "rainy"]
    }
];


// ---------------------------------------------------------
// GET MOOD CATEGORY FROM COOKIE
// ---------------------------------------------------------
function getMoodCategory() {
    const cookies = document.cookie.split(";");

    let moodValue = 50;
    for (let c of cookies) {
        c = c.trim();
        if (c.startsWith("Mood=")) {
            moodValue = parseInt(c.split("=")[1]);
        }
    }

    if (moodValue <= 35) return "sad";
    if (moodValue >= 75) return "happy";
    return "neutral";
}

// ---------------------------------------------------------
// LOAD SUGGESTED TASKS (MOOD + WEATHER)
// ---------------------------------------------------------
export function loadSuggestedTasks() {
    // Remove previous cards
    const existing = suggestedPanel.querySelectorAll(".suggested-task-card");
    existing.forEach(card => card.remove());

    const mood = getMoodCategory();
    const weather = getCurrentWeatherCondition();

    const filtered = suggestedTasksDB.filter(task =>
        task.moods.includes(mood) &&
        task.weathers.includes(weather)
    );

    filtered.forEach(task => createSuggestedTaskCard(task, weather));
}

// ---------------------------------------------------------
// CREATE EACH SUGGESTED CARD
// ---------------------------------------------------------
function createSuggestedTaskCard(task, weather) {
    fetch("./Components/suggestedTaskComponent.html")
        .then(res => res.text())
        .then(html => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = html.trim();
            const card = wrapper.firstElementChild;

            card.querySelector(".suggested-title").innerText = task.name;
            card.querySelector(".suggested-reason").innerText = task.reason;

            card.querySelector(".suggested-add-btn")
                .addEventListener("click", () => addSuggestedTask(task, weather));

            suggestedPanel.appendChild(card);
        });
}

// ---------------------------------------------------------
// ADD TASK FROM SUGGESTIONS (WITH WEATHER)
// ---------------------------------------------------------
function addSuggestedTask(task, weather) {
    const newTask = {
        id: crypto.randomUUID(),
        name: task.name,
        desc: task.desc,
        date: new Date().toISOString().slice(0, 10),
        completed: false,
        weather // 🔥 IMPORTANT: preserve weather
    };

    const stored = JSON.parse(localStorage.getItem("tasks") || "[]");
    stored.push(newTask);
    localStorage.setItem("tasks", JSON.stringify(stored));

    renderTask(newTask);
    updateTaskCount();
}
