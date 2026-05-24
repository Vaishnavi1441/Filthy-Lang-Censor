# Audio Profanity Moderator

Upload an audio file, detect profanity with [AssemblyAI](https://www.assemblyai.com/), and download the same recording with every bad word replaced by a beep.

Inspired by the [AssemblyAI profanity-filter-demo](https://github.com/AssemblyAI/profanity-filter-demo).

![ClearWave](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![AssemblyAI](https://img.shields.io/badge/AssemblyAI-API-000000)

## Features

- **Upload audio** - MP3, WAV, M4A, OGG, FLAC, and more
- **Automatic profanity detection** - powered by AssemblyAI `filter_profanity`
- **Beep censorship** - profane segments are replaced with a tone at the exact timestamps
- **Transcript & report** - view censored transcript and flagged words with timestamps
- **Custom word lists** - add blocked or allowed words in the sidebar
- **Download** - export the moderated MP3

## How it works

```
Audio upload - AssemblyAI transcription (profanity filter on)
             - Find censored words (e.g. f***)
             - Splice beeps at word timestamps (pydub + FFmpeg)
             = Return moderated audio + transcript + flags
```

1. You upload an audio file.
2. The backend uploads it to AssemblyAI and transcribes with `filter_profanity: true`.
3. Profane words appear in the transcript as censored text (e.g. `f***`).
4. The backend locates those words by timestamp and overlays a beep on each segment.
5. You play or download the moderated file and review the flagged-word list.

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React, Vite, Lucide icons |
| Backend | Python, FastAPI, pydub |
| AI | AssemblyAI (Universal-3 Pro / Universal-2) |
| Audio | FFmpeg |

## Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **FFmpeg** - [install guide](https://ffmpeg.org/download.html)
- **AssemblyAI API key** - [free signup](https://www.assemblyai.com/dashboard/signup)

## Setup

### 1. Clone and configure

```bash
git clone https://github.com/sudo-pixel-spec/Audio-Profanity-Moderator.git
cd Audio-Profanity-Moderator
cp .env.example .env
```

Edit `.env` and add your key:

```bash
ASSEMBLYAI_API_KEY=your_key
```

### 2. Install dependencies

```bash
cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt
cd ../frontend && npm install
```

### 3. Run

**Terminal 1 - backend** (http://127.0.0.1:8000):

```bash
./start-backend.sh
```

**Terminal 2 - frontend** (http://localhost:5173):

```bash
./start-frontend.sh
```

Open the frontend URL, drop an audio file, and wait for processing to finish.

> The backend loads `.env` from the project root automatically.

## Project structure

```
├── .env.example
├── start-backend.sh
├── start-frontend.sh
├── backend/
│   ├── main.py                 # FastAPI routes
│   └── services/
│       ├── assemblyai.py       # Upload + transcribe
│       └── censor.py             # Beep profanity segments
└── frontend/
    └── src/
        └── AudioModerator.jsx  # Main UI
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check + API key status |
| `POST` | `/api/moderate` | Upload audio; returns transcript, flags, audio URL |
| `GET` | `/api/moderate/{job_id}/audio` | Download moderated MP3 |

### Example: moderate audio

```bash
curl -X POST http://127.0.0.1:8000/api/moderate \
  -F "file=@sample.mp3" \
  -F "language=English" \
  -F "bleep_audio=true" \
  -F 'blocked_words=[]' \
  -F 'allowed_words=[]'
```

## Configuration (UI sidebar)

| Setting | Description |
|---------|-------------|
| **Language** | Transcription language (English, Spanish, etc.) |
| **Auto-bleep audio** | Replace profanity with beeps (off = transcript only) |
| **Blocked words** | Extra words to flag and beep |
| **Allowed words** | Words to skip even if detected |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `speech_models must be a non-empty list` | Pull latest code - AssemblyAI requires `speech_models` on every request |
| `ASSEMBLYAI_API_KEY not set` | Create `.env` in project root with your key |
| Audio export fails | Install FFmpeg and ensure it is on your `PATH` |

## Acknowledgments

- [AssemblyAI profanity-filter-demo](https://github.com/AssemblyAI/profanity-filter-demo)
- [AssemblyAI Profanity Filtering docs](https://www.assemblyai.com/docs/guardrails/filter-profanity-from-transcripts)
