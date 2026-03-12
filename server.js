const express = require("express");
const path = require("path");
const cors = require("cors");

require("./db");

const authRoutes = require("./routes/authRoutes");
const submissionRoutes = require("./routes/submissionRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);

app.use("/static", express.static(path.join(__dirname, "static")));
app.use(express.static(path.join(__dirname, "templates")));

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});