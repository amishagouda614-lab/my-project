const uploadForm = document.getElementById("uploadForm");
const videoFile = document.getElementById("videoFile");
const message = document.getElementById("message");

const allowedExtensions = [
    ".mp4",
    ".mkv",
    ".mov"
];

const maxSize = 500 * 1024 * 1024;

uploadForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const file = videoFile.files[0];

    // Check whether a file was selected
    if (!file) {
        message.textContent =
            "Please select a video file.";
        return;
    }

    // Check extension
    const extension =
        "." + file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(extension)) {
        message.textContent =
            "Invalid format. Please upload MP4, MKV, or MOV.";
        return;
    }

    // Check file size
    if (file.size > maxSize) {
        message.textContent =
            "File is too large. Maximum size is 500 MB.";
        return;
    }

    const formData = new FormData();

    formData.append("video", file);

    message.textContent = "Uploading...";

    try {

        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.success) {

            message.textContent =
                "✓ " +
                result.message +
                " File: " +
                result.filename;

            uploadForm.reset();

        } else {

            message.textContent =
                "✗ " +
                result.message;
        }

    } catch (error) {

        console.error(error);

        message.textContent =
            "Upload failed. Please try again.";
    }
});