
import os
import subprocess
import requests

from flask import Flask, request, jsonify
from faster_whisper import WhisperModel


app = Flask(__name__)

PORT = 5000

# ==========================================
# LOCAL AI SETTINGS
# ==========================================

WHISPER_MODEL = "base"
OLLAMA_MODEL = "llama3.2:3b"

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"


# ==========================================
# LANGUAGE CONFIGURATION
# ==========================================

LANGUAGE_MAP = {
    "hi": "Hindi",
    "hindi": "Hindi",
    "हिंदी": "Hindi",

    "en": "English",
    "english": "English",

    "fr": "French",
    "french": "French",

    "es": "Spanish",
    "spanish": "Spanish",

    "de": "German",
    "german": "German",

    "ta": "Tamil",
    "tamil": "Tamil",

    "te": "Telugu",
    "telugu": "Telugu",

    "mr": "Marathi",
    "marathi": "Marathi",

    "bn": "Bengali",
    "bengali": "Bengali",

    "ja": "Japanese",
    "japanese": "Japanese",

    "zh": "Chinese",
    "chinese": "Chinese"
}


def get_selected_language():

    raw_language = request.form.get(
        "language", "English"
    ).strip()

    language = LANGUAGE_MAP.get(
        raw_language.lower(),
        LANGUAGE_MAP.get(
            raw_language,
            raw_language
        )
    )

    if not language:
        language = "English"

    print("Selected Language:", language)

    return language


# ==========================================
# LOAD WHISPER MODEL
# ==========================================

print("Loading Whisper model...")

whisper_model = WhisperModel(
    WHISPER_MODEL,
    device="cpu",
    compute_type="int8"
)

print("Whisper model loaded successfully.")


# ==========================================
# GENERATE LANGUAGE PROMPT
# ==========================================

def create_summary_prompt(transcript, language):

    script_instruction = ""

    if language == "Hindi":
        script_instruction = """
        Write in natural Hindi using Devanagari script.
        Do not write Hindi sentences using English letters.
        """

    elif language == "Tamil":
        script_instruction = """
        Write in natural Tamil using Tamil script.
        """

    elif language == "Telugu":
        script_instruction = """
        Write in natural Telugu using Telugu script.
        """

    elif language == "Bengali":
        script_instruction = """
        Write in natural Bengali using Bengali script.
        """

    elif language == "Marathi":
        script_instruction = """
        Write in natural Marathi using Devanagari script.
        """

    elif language == "Japanese":
        script_instruction = """
        Write in natural Japanese using Japanese writing systems.
        """

    elif language == "Chinese":
        script_instruction = """
        Write in natural Simplified Chinese.
        """

    else:
        script_instruction = f"""
        Write using natural and grammatically correct {language}.
        """

    prompt = f"""
You are an expert multilingual AI video summarizer.

YOUR MAIN TASK:

Summarize the given video transcript completely
in the selected language: {language}.

STRICT LANGUAGE RULES:

1. The entire summary MUST be in {language}.
2. Do not generate the summary in English unless English is selected.
3. Translate the meaning naturally, not word by word.
4. Do not copy English sentences from the transcript.
5. All headings must also be in {language}.
6. Keep names, technical terms and proper nouns accurate.
7. Do not mix languages unnecessarily.
8. Follow the requested writing script.

{script_instruction}

OUTPUT STRUCTURE:

Create the summary using these four sections.

1. Overview
2. Key Points
3. Important Details
4. Conclusion

Translate these headings into {language}.

CONTENT REQUIREMENTS:

- Explain the main topic of the video.
- Include the most important information.
- Mention important facts and ideas.
- Keep the summary clear and easy to understand.
- Avoid unnecessary repetition.
- Do not add information that is not in the transcript.

IMPORTANT:
Before responding, check that the entire output
is written in {language}.

VIDEO TRANSCRIPT:

{transcript}

Now generate the complete video summary
ONLY in {language}.
"""

    return prompt


# ==========================================
# SUMMARIZE VIDEO API
# ==========================================

@app.route("/summarize", methods=["POST"])
def summarize():

    if "video" not in request.files:

        return jsonify({
            "success": False,
            "message": "No video file received."
        }), 400

    video = request.files["video"]

    language = get_selected_language()

    if video.filename == "":

        return jsonify({
            "success": False,
            "message": "Please select a video."
        }), 400

    # ======================================
    # TEMPORARY FILE PATHS
    # ======================================

    extension = os.path.splitext(
        video.filename
    )[1].lower()

    video_path = os.path.join(
        os.getcwd(),
        "temp_video" + extension
    )

    audio_path = os.path.join(
        os.getcwd(),
        "temp_audio.mp3"
    )

    try:

        # ==================================
        # SAVE VIDEO
        # ==================================

        video.save(video_path)

        print("Video saved successfully.")

        print("Processing video...")
        print("Summary Language:", language)

        # ==================================
        # STEP 1: EXTRACT AUDIO
        # ==================================

        print("Extracting audio using FFmpeg...")

        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                video_path,
                "-vn",
                "-acodec",
                "libmp3lame",
                "-q:a",
                "4",
                audio_path
            ],
            check=True,
            capture_output=True
        )

        print("Audio extracted successfully.")

        # ==================================
        # STEP 2: WHISPER TRANSCRIPTION
        # ==================================

        print("Transcribing audio with Whisper...")

        segments, info = whisper_model.transcribe(
            audio_path,
            beam_size=5,
            vad_filter=True
        )

        print("Detected audio language:", info.language)

        print(
            "Language probability:",
            info.language_probability
        )

        transcript_parts = []

        for segment in segments:

            text = segment.text.strip()

            if text:
                transcript_parts.append(text)

        transcript_text = " ".join(
            transcript_parts
        )

        print("Transcription completed.")

        print(
            "Transcript preview:",
            transcript_text[:500]
        )

        print(
            "Transcript length:",
            len(transcript_text)
        )

        if not transcript_text.strip():

            return jsonify({
                "success": False,
                "message": "Could not detect speech in the video."
            }), 400

        # ==================================
        # STEP 3: CREATE LANGUAGE PROMPT
        # ==================================

        print("Creating summary prompt...")

        prompt = create_summary_prompt(
            transcript_text,
            language
        )

        # ==================================
        # STEP 4: OLLAMA SUMMARY
        # ==================================

        print("Generating summary with Ollama...")

        ollama_response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.2,
                    "num_ctx": 8192
                }
            },
            timeout=600
        )

        # ==================================
        # CHECK OLLAMA RESPONSE
        # ==================================

        if ollama_response.status_code != 200:

            print(
                "Ollama error:",
                ollama_response.text
            )

            return jsonify({
                "success": False,
                "message": "Ollama could not generate the summary."
            }), 500

        ollama_data = ollama_response.json()

        summary = ollama_data.get(
            "response", ""
        ).strip()

        if not summary:

            return jsonify({
                "success": False,
                "message": "Ollama returned an empty summary."
            }), 500

        print("Summary generated successfully.")

        print("Generated language:", language)

        print("Summary preview:", summary[:500])

        # ==================================
        # STEP 5: SEND RESULT TO NODE.JS
        # ==================================

        return jsonify({

            "success": True,

            "message": "Video summarized successfully!",

            "language": language,

            "summary": summary,

            "transcript": transcript_text

        })

    # ======================================
    # ERROR HANDLING
    # ======================================

    except subprocess.CalledProcessError as e:

        print("FFmpeg error:")

        print(
            e.stderr.decode(errors="ignore")
        )

        return jsonify({
            "success": False,
            "message": "FFmpeg could not process the video."
        }), 500

    except requests.exceptions.ConnectionError:

        print("Could not connect to Ollama.")

        return jsonify({
            "success": False,
            "message": "Could not connect to Ollama. Make sure Ollama is running."
        }), 500

    except requests.exceptions.Timeout:

        print("Ollama request timed out.")

        return jsonify({
            "success": False,
            "message": "Ollama took too long to generate the summary."
        }), 504

    except Exception as e:

        print("ERROR:", str(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:

        # ==================================
        # CLEAN TEMPORARY FILES
        # ==================================

        if os.path.exists(video_path):

            os.remove(video_path)

            print("Temporary video deleted.")

        if os.path.exists(audio_path):

            os.remove(audio_path)

            print("Temporary audio deleted.")

        print("Temporary files cleaned up.")


# ==========================================
# START FLASK SERVER
# ==========================================

if __name__ == "__main__":

    print(
        "AI Summarizer running at http://127.0.0.1:5000"
    )

    app.run(
        host="127.0.0.1",
        port=PORT,
        debug=False
    )
