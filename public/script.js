const videoFile = document.getElementById("videoFile");
const selectedFile = document.getElementById("selectedFile");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const dropZone = document.getElementById("dropZone");

const uploadForm = document.getElementById("uploadForm");
const uploadButton = document.getElementById("generateButton");
const message = document.getElementById("message");


// ===============================
// FILE SELECT
// ===============================

videoFile.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) {
        selectedFile.style.display = "none";
        return;
    }

    showSelectedFile(file);
});


// ===============================
// SHOW SELECTED FILE
// ===============================

function showSelectedFile(file) {

    fileName.textContent = file.name;

    const sizeMB =
        (file.size / (1024 * 1024)).toFixed(2);

    fileSize.textContent = `${sizeMB} MB`;

    selectedFile.style.display = "flex";

    message.textContent = "";
}


// ===============================
// DRAG & DROP
// ===============================

dropZone.addEventListener("dragover", function (event) {

    event.preventDefault();

    dropZone.classList.add("dragover");
});


dropZone.addEventListener("dragleave", function () {

    dropZone.classList.remove("dragover");
});


dropZone.addEventListener("drop", function (event) {

    event.preventDefault();

    dropZone.classList.remove("dragover");

    const files = event.dataTransfer.files;

    if (files.length > 0) {

        const file = files[0];

        videoFile.files = files;

        showSelectedFile(file);
    }
});


// ===============================
// GENERATE SUMMARY
// ===============================

uploadForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const file = videoFile.files[0];


    // No file
    if (!file) {

        message.textContent =
            "⚠️ Please select a video first.";

        message.style.color = "#dc2626";

        return;
    }


    // File type
    const allowedTypes = [
        ".mp4",
        ".mkv",
        ".mov"
    ];

    const extension =
        "." + file.name.split(".").pop().toLowerCase();


    if (!allowedTypes.includes(extension)) {

        message.textContent =
            "⚠️ Only MP4, MKV, and MOV files are allowed.";

        message.style.color = "#dc2626";

        return;
    }


    // File size
    const maxSize =
        500 * 1024 * 1024;


    if (file.size > maxSize) {

        message.textContent =
            "⚠️ File size cannot exceed 500 MB.";

        message.style.color = "#dc2626";

        return;
    }


    // Disable button
    uploadButton.disabled = true;

    uploadButton.textContent =
        "⏳ Generating Summary...";

    message.textContent =
        "🎬 Processing video... This may take some time.";

    message.style.color = "#5146e5";


    // FormData
    const formData = new FormData();

    formData.append("video", file);
const language =
    document.getElementById("summaryLanguage").value;

console.log("Selected Summary Language:", language);

formData.append("language", language);

    try {

        // Send video to Node.js
        // Node.js → Python → OpenAI
        const response = await fetch(
            "/summarize",
            {
                method: "POST",
                body: formData
            }
        );


        const result =
            await response.json();


        // ===============================
        // SUCCESS
        // ===============================

        if (response.ok && result.success) {

            message.textContent =
                "✅ Summary generated successfully!";

            message.style.color =
                "#16a34a";


            uploadButton.textContent =
                "✅ Summary Generated";


            // Show summary
            showSummary(result.summary);

            console.log(
                "Transcript:",
                result.transcript
            );

        }


        // ===============================
        // ERROR
        // ===============================

        else {

            message.textContent =
                "❌ " +
                (result.message ||
                "Summary generation failed.");

            message.style.color =
                "#dc2626";

            uploadButton.textContent =
                "✨ Generate Summary";

            uploadButton.disabled =
                false;
        }


    } catch (error) {

        console.error(
            "Summary error:",
            error
        );


        message.textContent =
            "❌ Unable to connect to the server.";

        message.style.color =
            "#dc2626";


        uploadButton.textContent =
            "✨ Generate Summary";

        uploadButton.disabled =
            false;
    }

});


// ===============================
// SHOW SUMMARY
// ===============================

function showSummary(summary) {

    let summaryBox =
        document.getElementById("summaryBox");


    // Create summary box if it doesn't exist
    if (!summaryBox) {

        summaryBox =
            document.createElement("div");

        summaryBox.id =
            "summaryBox";

        summaryBox.style.marginTop =
            "30px";

        summaryBox.style.padding =
            "25px";

        summaryBox.style.background =
            "#f8fafc";

        summaryBox.style.borderRadius =
            "12px";

        summaryBox.style.textAlign =
            "left";

        summaryBox.style.whiteSpace =
            "pre-wrap";

        summaryBox.style.lineHeight =
            "1.7";

        summaryBox.style.border =
            "1px solid #e5e7eb";

        uploadForm.parentNode.appendChild(
            summaryBox
        );
    }


    summaryBox.innerHTML = "";


    const title =
        document.createElement("h2");

    title.textContent =
        "✨ AI Video Summary";

    title.style.marginTop =
        "0";

    summaryBox.appendChild(title);


    const content =
        document.createElement("div");

    content.textContent =
        summary;

    summaryBox.appendChild(content);


    // Scroll to summary
    summaryBox.scrollIntoView({
        behavior: "smooth"
    });
}