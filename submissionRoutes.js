const express = require("express");
const router = express.Router();
const db = require("../db");
const submissionController = require("../controllers/submissionController");

/* =========================
   SUBMIT ASSIGNMENT
========================= */

router.post(
    "/submit",
    submissionController.upload,
    submissionController.submitAssignment
);

/* =========================
   GET ALL SUBMISSIONS (Faculty View)
========================= */

router.get("/all", (req, res) => {

    const subject = req.query.subject;
    let query = `
        SELECT submissions.id,
               users.name,
               submissions.subject,
               submissions.title,
               submissions.plagiarism_score,
               submissions.marks,
               submissions.feedback
        FROM submissions
        JOIN users ON submissions.student_id = users.id
    `;

    let values = [];

    if (subject) {
        query += " WHERE submissions.subject = ?";
        values.push(subject);
    }

    db.query(query, values, (err, results) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});

/* =========================
   GRADE SUBMISSION
========================= */

router.post("/grade", (req, res) => {

    const { submissionId, marks, feedback } = req.body;

    db.query(
        "UPDATE submissions SET marks = ?, feedback = ? WHERE id = ?",
        [marks, feedback, submissionId],
        (err) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({ message: "Graded successfully" });
        }
    );
});

/* =========================
   GET STUDENT SUBMISSIONS
========================= */

router.get("/student/:userId", (req, res) => {

    const userId = req.params.userId;

    db.query(
        `SELECT subject,
                title,
                plagiarism_score,
                marks,
                feedback
         FROM submissions
         WHERE student_id = ?`,
        [userId],
        (err, results) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json(results);
        }
    );
});

module.exports = router;