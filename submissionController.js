const db = require("../db");
const multer = require("multer");
const fs = require("fs");
const natural = require("natural");

const TfIdf = natural.TfIdf;

/* ===========================
   MULTER CONFIGURATION
=========================== */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

exports.upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "text/plain") {
            cb(null, true);
        } else {
            cb(new Error("Only .txt files allowed"));
        }
    }
}).single("assignmentFile");

/* ===========================
   COSINE SIMILARITY FUNCTION
=========================== */

function calculateSimilarity(text1, text2) {
    const tfidf = new TfIdf();

    tfidf.addDocument(text1);
    tfidf.addDocument(text2);

    const terms = new Set();

    tfidf.listTerms(0).forEach(item => terms.add(item.term));
    tfidf.listTerms(1).forEach(item => terms.add(item.term));

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    terms.forEach(term => {
        const tfidfA = tfidf.tfidf(term, 0);
        const tfidfB = tfidf.tfidf(term, 1);

        dotProduct += tfidfA * tfidfB;
        normA += tfidfA * tfidfA;
        normB += tfidfB * tfidfB;
    });

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
}

/* ===========================
   SUBMIT ASSIGNMENT
=========================== */

exports.submitAssignment = (req, res) => {

    const { userId, subject, title } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: "File not uploaded" });
    }

    const filePath = req.file.path;

    fs.readFile(filePath, "utf8", (err, newText) => {

        if (err) {
            return res.status(500).json({ error: "File read error" });
        }

        // 🔥 IMPORTANT FIX:
        // Compare only with other students
        db.query(
            "SELECT text_content FROM submissions WHERE subject = ? AND title = ? AND student_id != ?",
            [subject, title, userId],
            (err, results) => {

                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                let highestSimilarity = 0;

                results.forEach(previous => {

                    const similarity = calculateSimilarity(
                        previous.text_content,
                        newText
                    );

                    if (similarity > highestSimilarity) {
                        highestSimilarity = similarity;
                    }
                });

                const percentage = (highestSimilarity * 100).toFixed(2);

                db.query(
                    `INSERT INTO submissions 
                    (student_id, subject, title, file_path, text_content, plagiarism_score)
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [userId, subject.trim(), title.trim(), filePath, newText, percentage],
                    (err) => {

                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }

                        res.json({
                            message: "Assignment submitted successfully",
                            plagiarism: percentage
                        });
                    }
                );
            }
        );
    });
};