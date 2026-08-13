const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

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

const allowedExtensions = [".mp4", ".mkv", ".mov"];

const fileFilter = function (req, file, cb) {

    console.log("=================================");
    console.log("FILE NAME:", file.originalname);
    console.log("MIME TYPE:", file.mimetype);

    const extension = path.extname(file.originalname).toLowerCase();

    console.log("EXTENSION:", extension);
    console.log("=================================");

    if (extension === ".mp4") {
        return cb(null, true);
    }

    if (extension === ".mkv") {
        return cb(null, true);
    }

    if (extension === ".mov") {
        return cb(null, true);
    }

    return cb(new Error(
        "Only MP4, MKV, and MOV video files are allowed."
    ));
};
// ==========================================
// MULTER CONFIGURATION
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
// UPLOAD API
// ==========================================

app.post(
    "/upload",
    upload.single("video"),
    function (req, res) {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message: "Please select a video file."

            });

        }

        console.log(
            "Video saved:",
            req.file.filename
        );

        res.status(201).json({

            success: true,

            message: "Video uploaded successfully!",

            filename: req.file.filename

        });

    }
);

// ==========================================
// ERROR HANDLING
// ==========================================

app.use(function (err, req, res, next) {

    console.error("Upload error:", err.message);

    if (err instanceof multer.MulterError) {

        if (err.code === "LIMIT_FILE_SIZE") {

            return res.status(400).json({

                success: false,

                message:
                    "File size cannot exceed 500 MB."

            });

        }

    }

    res.status(400).json({

        success: false,

        message:
            err.message || "Upload failed."

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