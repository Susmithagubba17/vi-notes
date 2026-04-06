require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Test route
//app.get('/', (req, res) => {
   // res.send("Server is running 🚀");
//});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.post('/register', async (req, res) => {
    console.log("Request received:", req.body);

    try {
        const { username, email, password } = req.body;

        const bcrypt = require('bcryptjs');
        const User = require('./User');

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        console.log("User saved");

        res.json({ message: "User registered successfully" });
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ message: "Error" });
    }
});
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const User = require('./User');
        const bcrypt = require('bcryptjs');

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = jwt.sign({ id: user._id }, "secretkey");

        res.json({
            message: "Login successful",
            token: token
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error logging in" });
    }
});

const path = require('path');

app.use(express.static('public'));
const jwt = require('jsonwebtoken');
const Text = require('./Text');

app.post('/save', async (req, res) => {
    try {
        const token = req.headers['authorization'];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // ✅ Decode token
        const decoded = jwt.verify(token, "secretkey");

        const { content, startTime, endTime, duration, pasteCount, pastedTextLength} = req.body;

        const newSession = new Text({
            userId: decoded.id,   // 🔥 link to user
            content,
            startTime,
            endTime,
            duration,
            pasteCount,
            pastedTextLength
        });

        await newSession.save();

        res.json({ message: "Session saved with user ✅" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error saving session" });
    }
});
app.get('/my-sessions', async (req, res) => {
    try {
        const token = req.headers['authorization'];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, "secretkey");

        const sessions = await Text.find({ userId: decoded.id });

        res.json(sessions);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error fetching sessions" });
    }
});
