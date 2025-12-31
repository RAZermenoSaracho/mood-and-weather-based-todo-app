const express = require("express");
const path = require("path");
const { engine } = require("express-handlebars");
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

// ---------------------------------------------------------
// DATABASE CONNECTION
// ---------------------------------------------------------
let isConnected = false;

async function connectDB() {
    if (isConnected) return;

    try {
        await mongoose.connect(process.env.MONGO_URI);
        isConnected = true;
        console.log("🟢 MongoDB connected");
    } catch (err) {
        console.error("🔴 MongoDB connection error:", err);
        throw err;
    }
}

connectDB();

// ---------------------------------------------------------
// APP CONFIG
// ---------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------
// MIDDLEWARE
// ---------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use(express.static(path.join(process.cwd(), "public")));

const session = require("express-session");

app.use(
    session({
        secret: process.env.SESSION_SECRET || "dev_secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        }
    })
);

// ---------------------------------------------------------
// HANDLEBARS CONFIG
// ---------------------------------------------------------
const rootPath = process.cwd();

app.engine(
    "hbs",
    engine({
        extname: ".hbs",
        partialsDir: path.join(rootPath, "views/partials"),
        helpers: {
            ifEquals(a, b, options) {
                return a === b ? options.fn(this) : options.inverse(this);
            }
        }
    })
);

app.set("view engine", "hbs");
app.set("views", path.join(rootPath, "views"));

// ---------------------------------------------------------
// MODELS
// ---------------------------------------------------------
const Task = require("./models/Task");

// ---------------------------------------------------------
// ROUTES
// ---------------------------------------------------------

// Home – render tasks from MongoDB
app.get("/", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.render("pages/index", {
                tasks: []
            });
        }

        const tasks = await Task.find({
            userId: req.session.userId
        }).lean();

        res.render("pages/index", {
            tasks
        });
    } catch (error) {
        console.error("Error loading tasks:", error);
        res.status(500).send("Internal Server Error");
    }
});

// ---------------------------------------------------------
// WEATHER API PROXY (FASE 4)
// ---------------------------------------------------------
app.get("/api/weather", async (req, res) => {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({
            error: "Latitude and longitude are required"
        });
    }

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

        const response = await fetch(url);
        const data = await response.json();

        const code = data?.current_weather?.weathercode ?? 0;

        let condition = "sunny";
        if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
            condition = "rainy";
        } else if ([2, 3].includes(code)) {
            condition = "cloudy";
        }

        res.json({ condition });
    } catch (error) {
        console.error("Weather API error:", error);
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
});

// ---------------------------------------------------------
// AUTH / USERS
// ---------------------------------------------------------

// Register (explicit signup)
app.post("/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Missing fields" });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: "Password too short" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashed,
            location: null // default → use browser GPS
        });

        req.session.userId = user._id;

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            location: user.location
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Registration failed" });
    }
});

// ---------------------------------------------------------
// Login
// ---------------------------------------------------------
app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Missing credentials" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // IMPORTANT: frontend switches to signup ONLY on this error
            return res.status(404).json({ error: "USER_NOT_FOUND" });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: "INVALID_PASSWORD" });
        }

        req.session.userId = user._id;

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            location: user.location
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Login failed" });
    }
});

// ---------------------------------------------------------
// Logout
// ---------------------------------------------------------
app.post("/auth/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

// ---------------------------------------------------------
// Get current user session
// ---------------------------------------------------------
app.get("/auth/me", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.json(null);
        }

        const user = await User.findById(req.session.userId).select("-password");
        res.json(user);
    } catch (err) {
        console.error("Get current user error:", err);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// ---------------------------------------------------------
// Update profile
// ---------------------------------------------------------
app.patch("/auth/me", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        let { name, email, password, location } = req.body;
        const updates = {};

        // Name
        if (typeof name === "string" && name.trim()) {
            updates.name = name.trim();
        }

        // Normalize location
        if (location === null) {
            updates.location = null; // force clear (use GPS)
        } else if (typeof location === "string") {
            const trimmed = location.trim();
            updates.location =
                trimmed === "" || trimmed.toLowerCase() === "none"
                    ? null
                    : trimmed;
        }

        // Email (must be unique)
        if (typeof email === "string" && email.trim()) {
            const emailUsed = await User.findOne({
                email: email.trim(),
                _id: { $ne: req.session.userId }
            });

            if (emailUsed) {
                return res.status(400).json({ error: "Email already in use" });
            }

            updates.email = email.trim();
        }

        // Password
        if (typeof password === "string" && password.trim()) {
            if (password.length < 8) {
                return res.status(400).json({ error: "Password too short" });
            }

            updates.password = await bcrypt.hash(password, 10);
        }

        const user = await User.findByIdAndUpdate(
            req.session.userId,
            updates,
            { new: true }
        ).select("-password");

        res.json(user);
    } catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// ---------------------------------------------------------
// Delete account
// ---------------------------------------------------------
app.delete("/auth/me", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        await User.findByIdAndDelete(req.session.userId);

        req.session.destroy(() => {
            res.json({ success: true });
        });
    } catch (err) {
        console.error("Delete account error:", err);
        res.status(500).json({ error: "Failed to delete account" });
    }
});

// ---------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}

// ---------------------------------------------------------
// TASKS CRUD API (USER-SCOPED)
// ---------------------------------------------------------
// All task operations are scoped to the authenticated user
// via req.session.userId
// ---------------------------------------------------------

// ---------------------------------------------------------
// COMPLETE ALL TASKS
// IMPORTANT: Must be declared BEFORE any `/tasks/:id` route
// ---------------------------------------------------------
app.patch("/tasks/complete-all", requireAuth, async (req, res) => {
    try {
        const result = await Task.updateMany(
            { userId: req.session.userId, completed: false },
            { $set: { completed: true } }
        );

        // Optional: return how many were updated (useful for UI)
        res.json({
            success: true,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        console.error("Complete all error:", err);
        res.status(500).json({ error: "Failed to complete all tasks" });
    }
});

// ---------------------------------------------------------
// CREATE TASK
// ---------------------------------------------------------
app.post("/tasks", requireAuth, async (req, res) => {
    try {
        const { name, desc, date, weather } = req.body;

        // Basic validation
        if (!name || !date || !weather) {
            return res.status(400).json({
                error: "Missing required fields (name, date, weather)"
            });
        }

        const task = await Task.create({
            name,
            desc: desc || "",
            date,
            weather,
            completed: false,
            userId: req.session.userId
        });

        res.status(201).json(task);
    } catch (err) {
        console.error("Create task error:", err);
        res.status(500).json({ error: "Failed to create task" });
    }
});

// ---------------------------------------------------------
// TOGGLE TASK COMPLETION (single task)
// ---------------------------------------------------------
app.patch("/tasks/:id", requireAuth, async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            userId: req.session.userId
        });

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        task.completed = !task.completed;
        await task.save();

        res.json(task);
    } catch (err) {
        console.error("Toggle task error:", err);
        res.status(500).json({ error: "Failed to update task" });
    }
});

// ---------------------------------------------------------
// EDIT TASK (name / description / date)
// ---------------------------------------------------------
app.patch("/tasks/:id/edit", requireAuth, async (req, res) => {
    try {
        const { name, desc, date } = req.body;

        if (!name || !date) {
            return res.status(400).json({
                error: "Name and date are required"
            });
        }

        const task = await Task.findOne({
            _id: req.params.id,
            userId: req.session.userId
        });

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        task.name = name;
        task.desc = desc || "";
        task.date = date;

        await task.save();
        res.json(task);
    } catch (err) {
        console.error("Edit task error:", err);
        res.status(500).json({ error: "Failed to edit task" });
    }
});

// ---------------------------------------------------------
// DELETE TASK
// ---------------------------------------------------------
app.delete("/tasks/:id", requireAuth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            userId: req.session.userId
        });

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Delete task error:", err);
        res.status(500).json({ error: "Failed to delete task" });
    }
});

// ---------------------------------------------------------
// SERVER START
// ---------------------------------------------------------

if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export app for Vercel serverless
module.exports = app;

