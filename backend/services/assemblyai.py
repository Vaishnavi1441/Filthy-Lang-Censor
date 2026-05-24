import os
import time
from pathlib import Path

import requests

TRANSCRIPT_ENDPOINT = "https://api.assemblyai.com/v2/transcript"
UPLOAD_ENDPOINT = "https://api.assemblyai.com/v2/upload"
CHUNK_SIZE = 5_242_880
POLL_INTERVAL_SEC = 3

LANGUAGE_MAP = {
    "english": "en_us",
    "spanish": "es",
    "french": "fr",
    "german": "de",
    "japanese": "ja",
    "portuguese": "pt",
}


def _headers() -> dict[str, str]:
    api_key = os.environ.get("ASSEMBLYAI_API_KEY")
    if not api_key:
        raise RuntimeError("ASSEMBLYAI_API_KEY environment variable is not set")
    return {
        "authorization": api_key,
        "content-type": "application/json",
    }


def _check_response(response: requests.Response, step: str) -> None:
    if response.ok:
        return
    try:
        body = response.json()
        message = body.get("error") or body.get("message") or str(body)
    except Exception:
        message = response.text or response.reason
    raise RuntimeError(f"{step} failed ({response.status_code}): {message}")


def _read_file_chunks(path: Path):
    with path.open("rb") as handle:
        while chunk := handle.read(CHUNK_SIZE):
            yield chunk


def upload_file(path: Path) -> str:
    upload_headers = {"authorization": _headers()["authorization"]}
    response = requests.post(
        UPLOAD_ENDPOINT,
        headers=upload_headers,
        data=_read_file_chunks(path),
        timeout=300,
    )
    _check_response(response, "Audio upload")
    return response.json()["upload_url"]


def start_transcription(audio_url: str, language: str = "en") -> str:
    payload: dict = {
        "audio_url": audio_url,
        "speech_models": ["universal-3-pro", "universal-2"],
        "filter_profanity": True,
        "language_code": language,
    }
    response = requests.post(
        TRANSCRIPT_ENDPOINT,
        json=payload,
        headers=_headers(),
        timeout=60,
    )
    _check_response(response, "Transcription request")
    return response.json()["id"]


def get_transcript(transcript_id: str) -> dict:
    response = requests.get(
        f"{TRANSCRIPT_ENDPOINT}/{transcript_id}",
        headers={"authorization": _headers()["authorization"]},
        timeout=60,
    )
    _check_response(response, "Transcript fetch")
    return response.json()


def wait_for_transcript(transcript_id: str, poll_interval: float = POLL_INTERVAL_SEC) -> dict:
    while True:
        transcript = get_transcript(transcript_id)
        status = transcript["status"]
        if status == "completed":
            return transcript
        if status == "error":
            raise RuntimeError(transcript.get("error", "Transcription failed"))
        time.sleep(poll_interval)


def transcribe_file(path: Path, language: str = "en") -> dict:
    audio_url = upload_file(path)
    transcript_id = start_transcription(audio_url, language=language)
    return wait_for_transcript(transcript_id)