import asyncio
import os
import pathlib
import re
import tempfile
from functools import lru_cache
from typing import Literal, Optional

import openai
import stable_whisper
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel

from utils import convert_to_mp3

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

SUPPORTED_MODELS = {"whisper", "local-whisper"}
SUPPORTED_AUDIO_SUFFIXES = {".mp3", ".m4a", ".wav", ".ogg", ".webm"}
DEFAULT_AUDIO_SUFFIX = ".webm"
MAX_UPLOAD_BYTES = 100 * 1024 * 1024  # 100 MB


class SegmentResponse(BaseModel):
    text: str
    start: float
    end: float


class SaveRecordingResponse(BaseModel):
    message: str
    file_path: str
    filename: str
    content_type: str


class TranscriptionResponse(BaseModel):
    text: str
    segments: list[SegmentResponse] = []


@lru_cache(maxsize=1)
def get_local_model(model_size: str):
    return stable_whisper.load_model(model_size)


def sanitize_filename(value: str) -> str:
    cleaned = re.sub(r'[<>:"/\\|?*]', "_", value.strip())
    return cleaned.strip(" .") or "recording"


def normalise_suffix(filename: Optional[str], fallback: str = DEFAULT_AUDIO_SUFFIX) -> str:
    suffix = pathlib.Path(filename or "").suffix.lower()
    return suffix if suffix in SUPPORTED_AUDIO_SUFFIXES else fallback


def local_transcribe(audio_file: str) -> dict:
    """Transcribe an audio file using the cached local Whisper model."""
    model_size = os.getenv("WHISPER_MODEL_SIZE", "large-v3")
    model = get_local_model(model_size)
    result = model.transcribe(audio_file, language="en")

    segments = [
        {
            "text": segment.text,
            "start": segment.start,
            "end": segment.end,
        }
        for segment in (result.segments or [])
    ]

    return {
        "text": result.text,
        "segments": segments,
    }


app = FastAPI(title="EchoScribe API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8282",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/save-recording", response_model=SaveRecordingResponse)
async def save_recording(audio: UploadFile = File(...), filename: str = Form(...)):
    """Save a recorded audio file to Documents/temp transcribe/."""
    try:
        documents_path = pathlib.Path.home() / "Documents"
        temp_dir = documents_path / "temp transcribe"
        temp_dir.mkdir(parents=True, exist_ok=True)

        sanitized_name = sanitize_filename(filename)
        file_suffix = normalise_suffix(audio.filename)
        saved_filename = f"{sanitized_name}{file_suffix}"
        file_path = temp_dir / saved_filename

        content = await audio.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")
        with open(file_path, "wb") as handle:
            handle.write(content)

        return SaveRecordingResponse(
            message="Recording saved successfully",
            file_path=saved_filename,
            filename=saved_filename,
            content_type=audio.content_type or "application/octet-stream",
        )
    except Exception as error:
        print(f"Error saving recording: {error}")
        raise HTTPException(status_code=500, detail="Failed to save the recording locally.") from error


@app.post("/api/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    model: Literal["whisper", "local-whisper"] = Form("whisper"),
    prompt: Optional[str] = Form(None),
):
    if model not in SUPPORTED_MODELS:
        raise HTTPException(status_code=400, detail="Unsupported transcription model.")

    temp_path: Optional[str] = None
    converted_path: Optional[str] = None

    try:
        file_suffix = normalise_suffix(audio.filename)
        content = await audio.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=file_suffix) as temp_file:
            temp_path = temp_file.name
            temp_file.write(content)

        file_to_transcribe = temp_path

        if file_suffix != ".mp3":
            converted_path = convert_to_mp3(temp_path)
            file_to_transcribe = converted_path

        if model == "local-whisper":
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, local_transcribe, file_to_transcribe)
            return TranscriptionResponse(text=result["text"], segments=result["segments"])

        client = OpenAI()
        with open(file_to_transcribe, "rb") as audio_file:
            if prompt:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    prompt=prompt,
                )
            else:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                )

        return TranscriptionResponse(text=transcript.text, segments=[])
    except HTTPException:
        raise
    except Exception as error:
        print(f"Error transcribing audio: {error}")
        raise HTTPException(status_code=500, detail="The transcription request failed.") from error
    finally:
        for path in (temp_path, converted_path):
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass
