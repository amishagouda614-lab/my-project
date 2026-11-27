# AI-Based Video Summarizer

An AI-powered web application that converts long videos into short, meaningful summaries. It helps users save time by extracting speech from videos, converting it into text, and generating summaries using AI.

## Features

- Upload video files
- Extract audio from videos using FFmpeg
- Convert speech into text using Faster Whisper
- Support multiple languages, including English, Hindi, and Telugu
- Generate concise summaries using Ollama AI
- Simple web-based user interface

## Technologies Used

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, Flask
- **Speech-to-Text:** Faster Whisper
- **Audio/Video Processing:** FFmpeg
- **AI Model:** Ollama (Llama 3.2)

## Project Workflow

1. User uploads a video.
2. FFmpeg extracts audio from the video.
3. Faster Whisper converts audio into text.
4. The system processes the transcript.
5. Ollama generates a short and meaningful summary.
6. The summary is displayed to the user.

## Requirements

- Python 3.11
- Node.js and npm
- FFmpeg
- Ollama
- Llama 3.2 model

## How to Run the Project

### Start the Python Backend

```powershell
.\venv311\Scripts\python.exe app.py
```

Backend URL: http://127.0.0.1:5000

### Start the Frontend

Open another terminal and run:

```powershell
npm start
```

Frontend URL: http://localhost:3000

Keep both terminals running while using the application.

## Project Objective

The main objective of this project is to reduce the time required to watch long videos by automatically generating short and useful summaries.

## Author

Amisha Gouda