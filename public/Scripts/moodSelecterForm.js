import { loadSuggestedTasks } from "./suggestedTaskComponent.js";

const moodSelecter = document.getElementById("moodSelecter");

const savedMood = getCookie("Mood") || 50;

// Update top mood button icon
updateMoodSelecterButton(savedMood);

// ---------------------------------------------------------
// OPEN MOOD MODAL
// ---------------------------------------------------------
moodSelecter.addEventListener("click", () => {
    fetch("./Components/moodSelecterForm.html")
        .then(res => res.text())
        .then(html => {
            const modal = document.createElement("div");
            modal.innerHTML = html;
            document.body.appendChild(modal);

            const moodSlider = document.getElementById("moodSlider");

            // set internal value BEFORE first paint
            moodSlider.value = savedMood;
            moodSlider.style.setProperty("--value", savedMood + "%");

            // Update mood live while sliding
            moodSlider.addEventListener("input", () => {
                updateSlider(moodSlider, moodSlider.value);

                // REFRESH suggested tasks LIVE when slider changes
                loadSuggestedTasks();
            });

            // Reset to neutral (50)
            const resetBtn = document.getElementById("resetBtn");
            resetBtn.addEventListener("click", () => {
                deleteCookie("Mood");
                moodSlider.value = 50;
                moodSlider.style.setProperty("--value", "50%");
                updateMoodSelecterButton(50);

                // Refresh suggestions when resetting
                loadSuggestedTasks();
            });

            const closeBtn = modal.querySelector(".mood-close");
            closeBtn.addEventListener("click", () => modal.remove());
        });
});

// ---------------------------------------------------------
// UPDATE SLIDER + COOKIE + NAV ICON
// ---------------------------------------------------------

function updateSlider(element, value) {
    setCookie("Mood", value, 1);
    element.style.setProperty("--value", value + "%");
    updateMoodSelecterButton(value);
}

// ---------------------------------------------------------
// UPDATE NAVBAR MOOD ICON
// ---------------------------------------------------------
function updateMoodSelecterButton(savedMood) {
    const icon = moodSelecter.querySelector(".mood-icon");

    if (savedMood <= 35) {
        icon.textContent = "😢";
    } else if (savedMood >= 75) {
        icon.textContent = "😊";
    } else {
        icon.textContent = "😐";
    }
}

// ---------------------------------------------------------
// COOKIE HELPERS
// ---------------------------------------------------------

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    const cookies = document.cookie.split(";");

    for (let c of cookies) {
        c = c.trim();
        if (c.startsWith(name + "=")) {
            return c.substring(name.length + 1);
        }
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}
