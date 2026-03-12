const db = require("../db");
const bcrypt = require("bcrypt");

// REGISTER USER
exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, role],
            (err, result) => {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                res.json({ message: "User registered successfully" });
            }
        );
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

// LOGIN USER
exports.login = (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Server error" });
            }

            if (results.length === 0) {
                return res.status(400).json({ error: "User not found" });
            }

            const user = results[0];

            const match = await bcrypt.compare(password, user.password);

            if (!match) {
                return res.status(400).json({ error: "Invalid password" });
            }

            res.json({
                message: "Login successful",
                role: user.role,
                userId: user.id
            });
        }
    );
};