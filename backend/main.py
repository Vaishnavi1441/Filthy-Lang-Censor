import json
import os
import shutil
import tempfile
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydub import AudioSegment

from services.assemblyai import LANGUAGE_MAP, transcribe_file
from services.censor import build_results, censor_audio

app = FastAPI(title="ClearWave Audio Moderator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = Path(__file__).resolve().parent / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

jobs: dict[str, dict] = {}


def _cleanup(path: Path) -> None:
    if path.exists():
        path.unlink()


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "assemblyai_configured": bool(os.environ.get("ASSEMBLYAI_API_KEY")),
    }


@app.post("/api/moderate")
async def moderate_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    language: str = Form("English"),
    bleep_audio: bool = Form(True),
    blocked_words: str = Form("[]"),
    allowed_words: str = Form("[]"),
    sensitivity: int = Form(2),
    export_report: bool = Form(False),
    context_detection: bool = Form(True),
):
    if not file.content_type and not file.filename:
        raise HTTPException(status_code=400, detail="No audio file provided")

    try:
        blocked = json.loads(blocked_words)
        allowed = json.loads(allowed_words)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid word list JSON") from exc

    if not isinstance(blocked, list) or not isinstance(allowed, list):
        raise HTTPException(status_code=400, detail="Word lists must be JSON arrays")

    suffix = Path(file.filename or "audio.mp3").suffix or ".mp3"
    job_id = str(uuid.uuid4())
    temp_dir = Path(tempfile.mkdtemp(prefix="clearwave_"))
    input_path = temp_dir / f"input{suffix}"

    try:
        with input_path.open("wb") as handle:
            shutil.copyfileobj(file.file, handle)

        language_code = LANGUAGE_MAP.get(language.lower(), "en")
        
        transcript = transcribe_file(input_path, language=language_code)

        # Pass the new arguments into censor_audio
        moderated_bytes, flagged = censor_audio(
            input_path,
            transcript,
            blocked=blocked,
            allowed=allowed,
            bleep_audio=bleep_audio,
            sensitivity=sensitivity,
            context_detection=context_detection
        )

        duration_ms = len(AudioSegment.from_file(input_path))
        results = build_results(transcript, flagged, duration_ms)

        output_path = OUTPUT_DIR / f"{job_id}.mp3"
        output_path.write_bytes(moderated_bytes)

        # Handle Report Export
        report_url = None
        if export_report:
            report_path = OUTPUT_DIR / f"{job_id}_report.json"
            report_path.write_text(json.dumps(results, indent=2))
            report_url = f"/api/moderate/{job_id}/report"
            
            jobs[job_id] = {
                "results": results,
                "output_path": str(output_path),
                "report_path": str(report_path)
            }
        else:
            jobs[job_id] = {
                "results": results,
                "output_path": str(output_path),
            }

        background_tasks.add_task(_cleanup, input_path)
        background_tasks.add_task(lambda directory: shutil.rmtree(directory, ignore_errors=True), temp_dir)

        return {
            "job_id": job_id,
            **results,
            "moderated_audio_url": f"/api/moderate/{job_id}/audio",
            "report_url": report_url
        }
    except RuntimeError as exc:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        shutil.rmtree(temp_dir, ignore_errors=True)
        detail = str(exc)
        if detail.startswith("Processing failed:"):
            detail = detail.removeprefix("Processing failed: ").strip()
        raise HTTPException(status_code=500, detail=detail) from exc


@app.get("/api/moderate/{job_id}/audio")
def get_moderated_audio(job_id: str):
    job = jobs.get(job_id)
    if not job:
        output_path = OUTPUT_DIR / f"{job_id}.mp3"
        if not output_path.exists():
            raise HTTPException(status_code=404, detail="Moderated audio not found")
        return FileResponse(output_path, media_type="audio/mpeg", filename="moderated.mp3")

    return FileResponse(
        job["output_path"],
        media_type="audio/mpeg",
        filename="moderated.mp3",
    )


@app.get("/api/moderate/{job_id}/report")
def get_report(job_id: str):
    job = jobs.get(job_id)
    if not job or "report_path" not in job:
        report_path = OUTPUT_DIR / f"{job_id}_report.json"
        if not report_path.exists():
            raise HTTPException(status_code=404, detail="Report not found or not generated.")
        return FileResponse(report_path, media_type="application/json", filename=f"moderation_report_{job_id}.json")

    return FileResponse(
        job["report_path"],
        media_type="application/json",
        filename=f"moderation_report_{job_id}.json"
    )


@app.get("/api/moderate/{job_id}")
def get_job(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JSONResponse({**job["results"], "moderated_audio_url": f"/api/moderate/{job_id}/audio"})