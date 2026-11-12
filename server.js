const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const axios = require("axios");
const FormData = require("form-data");

const app = express();

const PORT = 3000;

// ==========================================
// UPLOAD DIRECTORY
// ==========================================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ==========================================
// STORAGE CONFIGURATION
// ==========================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },

    filename: function (req, file, cb) {

        const extension = path
            .extname(file.originalname)
            .toLowerCase();

        const uniqueName =
            crypto.randomUUID() + extension;

        cb(null, uniqueName);
    }

});

// ==========================================
// FILE VALIDATION
// ==========================================

const fileFilter = function (req, file, cb) {

    const allowedExtensions = [".mp4", ".mkv", ".mov"];

    const extension =
        path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(extension)) {
        return cb(null, true);
    }

    return cb(new Error(
        "Only MP4, MKV, and MOV video files are allowed."
    ));
};

// ==========================================
// MULTER
// ==========================================

const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {
        fileSize: 500 * 1024 * 1024
    }

});

// ==========================================
// FRONTEND
// ==========================================

app.use(express.static(
    path.join(__dirname, "public")
));

// ==========================================
// UPLOAD + AI SUMMARY
// ==========================================

app.post(
    "/summarize",
    upload.single("video"),
    async function (req, res) {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message: "Please select a video file."

            });

        }

        const videoPath = req.file.path;

        console.log("Video saved:", req.file.filename);

        try {

            // ==================================
            // SEND VIDEO TO PYTHON AI SERVER
            // ==================================

            const form = new FormData();

            form.append(
                "video",
                fs.createReadStream(videoPath),
                {
                    filename: req.file.originalname,
                    contentType: req.file.mimetype
                }
            );
const language = req.body.language || "English";

form.append("language", language);

console.log("Selected summary language:", language);
            console.log(
                "Sending video to Python AI server..."
            );

            const response = await axios.post(
                "http://127.0.0.1:5000/summarize",
                form,
                {
                    headers: form.getHeaders(),

                    maxContentLength:
                        Infinity,

                    maxBodyLength:
                        Infinity,

                    timeout: 0
                }
            );

            console.log(
                "AI summary received."
            );

            // ==================================
            // RETURN SUMMARY TO BROWSER
            // ==================================

            return res.status(200).json({

                success: true,

                message:
                    "Video summarized successfully!",

                summary:
                    response.data.summary,

                transcript:
                    response.data.transcript

            });

        }

        catch (error) {

            console.error(
                "AI processing error:",
                error.message
            );

            if (error.response) {

                console.error(
                    "Python server:",
                    error.response.data
                );

                return res.status(500).json({

                    success: false,

                    message:
                        error.response.data.message ||
                        "AI processing failed."

                });

            }

            return res.status(500).json({

                success: false,

                message:
                    "Could not connect to Python AI server. Make sure app.py is running."

            });

        }

        finally {

            // ==================================
            // DELETE TEMPORARY VIDEO
            // ==================================

            if (fs.existsSync(videoPath)) {

                fs.unlinkSync(videoPath);

                console.log(
                    "Temporary video deleted."
                );

            }

        }

    }
);

// ==========================================
// ERROR HANDLING
// ==========================================

app.use(function (err, req, res, next) {

    console.error(
        "Upload error:",
        err.message
    );

    if (err instanceof multer.MulterError) {

        if (err.code === "LIMIT_FILE_SIZE") {

            return res.status(400).json({

                success: false,

                message:
                    "File size cannot exceed 500 MB."

            });

        }

    }

    return res.status(400).json({

        success: false,

        message:
            err.message ||
            "Upload failed."

    });

});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, function () {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});

setInterval(() => {
    console.log("Server process is still running...");
}, 5000);