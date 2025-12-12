# 🌤️ Mood-Based To-Do App

A modern **Mood & Weather-aware To-Do application** built with **vanilla JavaScript**, designed to adapt task suggestions based on the user’s **mood** and **current weather conditions**.

This project was developed as part of **Module 3** of the Full-Stack Bootcamp and demonstrates **component-based architecture, clean UI/UX, API integration, and full CRUD functionality using localStorage**.

---

## ✨ Key Features

### 📝 Task Management (CRUD)
- Create, edit, complete, and delete tasks
- Tasks persist using `localStorage`
- Tasks store the **weather condition at creation time**
- Filter tasks by:
  - Completed / Incompleted
  - Weather (Sunny / Cloudy / Rainy)

### 😊 Mood System
- Interactive mood selector
- Mood stored and reused across the app
- Mood dynamically affects suggested tasks

### 🌦️ Weather Integration
- Uses **Open-Meteo API** (free, no API key)
- Browser geolocation with fallback to **Mexico City**
- Weather categories: `sunny`, `cloudy`, `rainy`
- Weather icons update dynamically across the UI

### 💡 Smart Suggested Tasks
- Suggested tasks depend on **both mood AND weather**
- AND-based filtering logic
- Adding a suggested task preserves weather metadata

### 👤 User Profile
- Login / Edit profile modal
- Client-side validation
- User data stored in `localStorage`
- Editable location used for weather
- Logout functionality

### 📱 Responsive Design
- Fully responsive (desktop & mobile)
- Mobile-friendly navbar
- Collapsible filters & actions
- Bootstrap Icons integration

---

## 🧰 Tech Stack

- HTML5
- CSS3 (Flexbox & Grid)
- Vanilla JavaScript (ES Modules)
- Open-Meteo Weather API
- localStorage
- Bootstrap Icons

---

## 📁 Project Structure

```
module-3/mood-based-todo-app
├── Assets
│   └── favicon.svg
├── Components
│   ├── editTaskForm.html
│   ├── loginForm.html
│   ├── moodSelecterForm.html
│   ├── suggestedTaskComponent.html
│   ├── taskComponent.html
│   └── taskCreationForm.html
├── Scripts
│   ├── index.js
│   ├── loginForm.js
│   ├── moodSelecterForm.js
│   ├── suggestedTaskComponent.js
│   ├── taskComponent.js
│   ├── taskCreationForm.js
│   ├── toast.js
│   └── weather.js
├── Styles
│   ├── index.css
│   ├── loginForm.css
│   ├── moodSelecter.css
│   ├── suggestedTaskComponent.css
│   ├── taskCreationForm.css
│   └── tasksComponent.css
├── index.html
└── README.md
```

---

## 🚀 How to Run

### Using Live Server (Recommended)
- Open `index.html` with VS Code Live Server

### Using Python
```bash
python3 -m http.server
```

---

## 🎯 Learning Outcomes
- Modular JS architecture
- API integration & fallbacks
- Responsive UI design
- State management with localStorage

---

## 📝 License
MIT License
