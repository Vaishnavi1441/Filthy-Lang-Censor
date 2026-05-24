import io
import re
from pathlib import Path

from pydub import AudioSegment
from pydub.generators import Sine

PROFANITY_PATTERN = re.compile(r"[a-zA-Z]\*+")
CATEGORY = "Profanity"


def _normalize_word(word: str) -> str:
    return re.sub(r"[^a-z0-9]", "", word.lower())


def _matches_blocked(word_text: str, blocked: set[str]) -> bool:
    for block in blocked:
        if "*" in block:
            pattern = "^" + re.escape(block).replace(r"\*", ".*") + "$"
            if re.match(pattern, word_text, re.IGNORECASE):
                return True
        elif _normalize_word(block) == _normalize_word(word_text):
            return True
    return False


def _is_profanity_word(
    word_text: str,
    blocked: set[str],
    allowed: set[str],
) -> bool:
    normalized = _normalize_word(word_text)
    if normalized in allowed or word_text.lower() in allowed:
        return False
    if _matches_blocked(word_text, blocked):
        return True
    # AssemblyAI replaces profanity with first letter + asterisks (e.g. "f***")
    return bool(PROFANITY_PATTERN.search(word_text))


def _format_timestamp(ms: int) -> str:
    total_seconds = max(0, ms // 1000)
    minutes = total_seconds // 60
    seconds = total_seconds % 60
    return f"{minutes}:{seconds:02d}"


def _make_beep(duration_ms: int) -> AudioSegment:
    duration_ms = max(50, duration_ms)
    return Sine(1000).to_audio_segment(duration=duration_ms).apply_gain(-6)


def _severity(word_text: str) -> str:
    asterisks = word_text.count("*")
    return "high" if asterisks >= 3 else "low"


def _context_snippet(words: list[dict], index: int) -> str:
    start = max(0, index - 3)
    end = min(len(words), index + 4)
    snippet = " ".join(item["text"] for item in words[start:end])
    return snippet.strip()


def find_flagged_words(
    transcript: dict,
    blocked: list[str] | None = None,
    allowed: list[str] | None = None,
) -> list[dict]:
    blocked_set = {_normalize_word(word) for word in (blocked or []) if word.strip()}
    allowed_set = {_normalize_word(word) for word in (allowed or []) if word.strip()}
    words = transcript.get("words") or []
    flagged: list[dict] = []

    for index, word in enumerate(words):
        text = word.get("text", "")
        if not _is_profanity_word(text, blocked_set, allowed_set):
            continue
        flagged.append(
            {
                "time": _format_timestamp(word["start"]),
                "start_ms": word["start"],
                "end_ms": word["end"],
                "word": text,
                "severity": _severity(text),
                "category": CATEGORY,
                "context": _context_snippet(words, index),
            }
        )

    return flagged


def censor_audio(
    audio_path: Path,
    transcript: dict,
    blocked: list[str] | None = None,
    allowed: list[str] | None = None,
    bleep_audio: bool = True,
) -> tuple[bytes, list[dict]]:
    flagged = find_flagged_words(transcript, blocked=blocked, allowed=allowed)
    sound = AudioSegment.from_file(audio_path)

    if not bleep_audio or not flagged:
        buffer = io.BytesIO()
        sound.export(buffer, format="mp3")
        return buffer.getvalue(), flagged

    blocked_set = {_normalize_word(word) for word in (blocked or []) if word.strip()}
    allowed_set = {_normalize_word(word) for word in (allowed or []) if word.strip()}
    words = transcript.get("words") or []

    output = AudioSegment.empty()
    last_end = 0

    for word in words:
        text = word.get("text", "")
        if not _is_profanity_word(text, blocked_set, allowed_set):
            continue

        start = word["start"]
        end = word["end"]
        output += sound[last_end:start]
        output += _make_beep(end - start)
        last_end = end

    output += sound[last_end:]

    buffer = io.BytesIO()
    output.export(buffer, format="mp3")
    return buffer.getvalue(), flagged


def build_results(
    transcript: dict,
    flagged: list[dict],
    duration_ms: int,
) -> dict:
    total_words = len(transcript.get("words") or [])
    violation_count = len(flagged)
    clean_score = 100 if total_words == 0 else max(0, round(100 - (violation_count / total_words) * 100))

    return {
        "duration": _format_timestamp(duration_ms),
        "duration_ms": duration_ms,
        "clean_score": clean_score,
        "transcript": transcript.get("text", ""),
        "flagged": flagged,
    }