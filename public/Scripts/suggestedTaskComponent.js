/**
 * SUGGESTED TASK SYSTEM
 * - Generates task suggestions based on mood + weather
 * - Avoids duplicates
 * - Creates real tasks via backend API
 * - Optimistic UI update (no page reload)
 */

import { getCurrentWeatherCondition } from "./weather.js";
import { showTaskSuccess, showTaskError } from "./toast.js";
import { renderTaskCard } from "./taskComponent.js";

// Suggested tasks container
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
// GET MOOD FROM COOKIE
// ---------------------------------------------------------
function getMoodCategory() {
    const moodCookie = document.cookie
        .split(";")
        .find(c => c.trim().startsWith("Mood="));

    const value = moodCookie ? parseInt(moodCookie.split("=")[1], 10) : 50;

    if (value <= 35) return "sad";
    if (value >= 75) return "happy";
    return "neutral";
}

// ---------------------------------------------------------
// LOAD SUGGESTED TASKS
// ---------------------------------------------------------
export function loadSuggestedTasks() {
    if (!suggestedPanel) return;

    // Clear existing suggestions
    suggestedPanel.querySelectorAll(".suggested-task-card").forEach(el => el.remove());

    const mood = getMoodCategory();
    const weather = getCurrentWeatherCondition();

    // Existing task names already rendered
    const existingTasks = Array.from(
        document.querySelectorAll(".task-title-adv")
    ).map(el => el.textContent.toLowerCase());

    const filtered = suggestedTasksDB.filter(task =>
        task.moods.includes(mood) &&
        task.weathers.includes(weather) &&
        !existingTasks.includes(task.name.toLowerCase())
    );

    filtered.slice(0, 5).forEach(task => renderSuggestedCard(task, weather));
}

// ---------------------------------------------------------
// RENDER SUGGESTED TASK CARD
// ---------------------------------------------------------
function renderSuggestedCard(task, weather) {
    const card = document.createElement("div");
    card.className = "suggested-task-card shadow-sm";

    card.innerHTML = `
        <div>
            <h6 class="suggested-title">${task.name}</h6>
            <p class="suggested-reason">${task.desc}</p>
        </div>
        <button class="suggested-add-btn" type="button">+</button>
    `;

    card.querySelector(".suggested-add-btn").addEventListener("click", () =>
        addSuggestedTask(task, weather, card)
    );

    suggestedPanel.appendChild(card);
}

// ---------------------------------------------------------
// ADD SUGGESTED TASK (BACKEND + OPTIMISTIC UI)
// ---------------------------------------------------------
async function addSuggestedTask(task, weather, card) {
    try {
        const res = await fetch("/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: task.name,
                desc: task.desc,
                date: new Date().toISOString().slice(0, 10),
                weather
            })
        });

        if (res.status === 401) {
            showTaskError("Please log in to add tasks");
            document.getElementById("loginModal")?.classList.remove("d-none");
            return;
        }

        if (!res.ok) throw new Error("Failed to create task");

        const createdTask = await res.json();

        // Remove suggestion instantly
        card.remove();

        // Render new task with correct weather icon
        renderTaskCard(createdTask);

        showTaskSuccess("Task added!");

        // 🔔 Notify app that tasks changed
        document.dispatchEvent(new CustomEvent("tasks:updated"));

    } catch (err) {
        console.error(err);
        showTaskError("Could not add suggested task");
    }
}
