import edge_tts
import io
from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()

VOICE = "en-IN-NeerjaNeural"
RATE = "+15%"
PITCH = "+0Hz"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


class TTSRequest(BaseModel):
    text: str


@router.options("/api/tts")
async def tts_options():
    return Response(status_code=200, headers=CORS_HEADERS)


@router.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    try:
        communicate = edge_tts.Communicate(
            request.text,
            VOICE,
            rate=RATE,
            pitch=PITCH
        )

        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])

        audio_buffer.seek(0)

        return StreamingResponse(
            audio_buffer,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=speech.mp3",
                **CORS_HEADERS,
            }
        )
    except Exception as e:
        return Response(
            content=f'{{"error": "{str(e)}"}}',
            status_code=500,
            media_type="application/json",
            headers=CORS_HEADERS,
        )
