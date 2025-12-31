# 🌦️ Mood-Based To-Do App  
**Full-Stack Application | Client → Server Migration (Module 4)**

A modern **Mood & Weather-aware To-Do application** built with **Node.js, Express, Handlebars, and MongoDB**.  
The app intelligently adapts task suggestions based on the user’s **mood** and **current weather conditions**, while providing a clean, reactive user experience without relying on frontend frameworks.

This project began as a **pure client-side application (Module 3)** and was later **fully migrated to a server-side rendered full-stack architecture (Module 4)**, adding **authentication, persistence, sessions, and SSR**.

---

## ✨ Key Features

### 👤 Authentication & User Management
- Login & Sign-up with **session-based authentication**
- Secure password hashing using **bcrypt**
- Persistent user accounts stored in **MongoDB**
- User profile management:
  - Name
  - Email
  - Password
  - Location (used for weather resolution)
- Logout and account deletion
- **All tasks are strictly scoped per authenticated user**

---

### 📝 Task Management (Full CRUD)
- Create, edit, complete, revert, and delete tasks
- Tasks persisted in **MongoDB** via Mongoose models
- Each task belongs to a specific user
- Tasks store the **weather condition at creation time**
- Task states:
  - Pending
  - Completed
- Bulk action:
  - **Complete all pending tasks**
- Completed tasks can be restored to pending

---

### 🌦️ Weather-Aware Logic
- Powered by **Open-Meteo APIs** (no API key required)
- Location resolution priority:
  1. User-defined location
  2. Browser geolocation
  3. Fallback logic
- Weather categories:
  - `sunny`
  - `cloudy`
  - `rainy`
- Dynamic weather icons rendered per task

---

### 💡 Smart Task Suggestions
- Suggested tasks adapt dynamically based on:
  - Current weather
  - User mood
- Suggestions update in real time
- Adding a suggested task:
  - Persists it as a real task in MongoDB
  - Removes the suggestion immediately
  - Updates the UI without page reloads

---

### 🔎 Advanced Filtering & UX
- Multi-select weather filters
- Filter by task status (pending / completed)
- Intelligent UI state handling:
  - “Complete All” button appears only when applicable
  - Hidden when viewing completed tasks
- Reactive counters and UI updates:
  - No page reloads
  - Event-driven synchronization

---

### 📱 Responsive Design
- Fully responsive layout (desktop & mobile)
- Mobile-friendly collapsible actions
- **Bootstrap Icons** for visual clarity

---

## 🧠 Architecture Highlights

- **Server-Side Rendering (SSR)** using Handlebars
- Express middleware for:
  - Sessions
  - Authentication guards
  - Request parsing
- MongoDB data models:
  - `User`
  - `Task`
- Event-driven frontend architecture:
  - Global `tasks:updated` custom event
  - UI synchronization without React/Vue
- Clear separation of concerns:
  - `server.js` → application bootstrap
  - `models/` → data layer
  - `views/` → SSR templates
  - `public/` → client-side behavior & styles

---

## 🧰 Tech Stack

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- express-session
- bcrypt
- dotenv

### Frontend
- Handlebars (SSR)
- Vanilla JavaScript (ES Modules)
- CSS3 (Flexbox & Grid)
- Bootstrap Icons

### External APIs
- Open-Meteo Weather API
- Open-Meteo Geocoding API

---

## 📁 Project Structure

```
weather-and-mood-based-todo-app/
├── server.js
├── package.json
├── package-lock.json
├── .env
├── views/
│   ├── layouts/
│   │   └── main.hbs
│   ├── pages/
│   │   └── index.hbs
│   └── partials/
│       ├── taskCard.hbs
│       ├── taskCreationForm.hbs
│       ├── editTaskForm.hbs
│       ├── loginForm.hbs
│       └── suggestedTaskComponent.hbs
├── public/
│   ├── Scripts/
│   ├── Styles/
│   ├── Components/
│   └── assets/
├── models/
│   ├── Task.js
│   └── User.js
└── README.md
```

---

## 🚀 Running the App Locally

Install dependencies:
```bash
npm install
```

Create a `.env` file:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
```

Start the server:
```bash
npm start
```

Open in your browser:
```
http://localhost:3000
```

---

## 🎯 Learning Outcomes (Module 4)

- Migrating a client-side app to a full-stack architecture
- Implementing session-based authentication
- MongoDB data modeling and persistence
- Server-side rendering with Handlebars
- Event-driven UI updates without frontend frameworks
- Managing real-world application state and user isolation

---

## 📝 License
MIT License
