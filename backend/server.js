require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./User');
const Text = require('./Text');

const app = express();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// =======================
// Middleware
// =======================
app.use(cors({
    origin: "https://vi-notes-zeta.vercel.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());

// =======================
// MongoDB Connection
// =======================
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
})
.then(() => {
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
})
.catch(err => {
    console.error("❌ MongoDB Connection Error");
    console.error(err);
});

// =======================
// Register
// =======================
app.post('/register', async (req, res) => {

    try {

        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        res.json({
            message: "User registered successfully"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Registration failed"
        });

    }

});

// =======================
// Login
// =======================
app.post('/login', async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id
            },
            JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.json({
            message: "Login successful",
            token
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Login failed"
        });

    }

});

// =======================
// Save Session
// =======================
app.post('/save', async (req, res) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader;

        const decoded = jwt.verify(token, JWT_SECRET);

        const {
            content,
            startTime,
            endTime,
            duration,
            pasteCount,
            pastedTextLength,
            totalKeystrokes
        } = req.body;

        const session = new Text({

            userId: decoded.id,
            content,
            startTime,
            endTime,
            duration,
            pasteCount,
            pastedTextLength,
            totalKeystrokes

        });

        await session.save();

        res.json({
            message: "Session saved successfully"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Error saving session"
        });

    }

});

// =======================
// View Sessions
// =======================
app.get('/my-sessions', async (req, res) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader;

        const decoded = jwt.verify(token, JWT_SECRET);

        const sessions = await Text.find({
            userId: decoded.id
        }).sort({
            createdAt: -1
        });

        res.json(sessions);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Error fetching sessions"
        });

    }

});
