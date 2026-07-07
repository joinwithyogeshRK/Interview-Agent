from fastapi import APIRouter
from groq_client import client
from models import ChatMessage, ChatResponse
from config import GROQ_MODEL, JARVIS_SYSTEM_PROMPT

router = APIRouter()


@router.post("/api/chat")
async def chat(message: ChatMessage):
    try:
        messages = [{"role": "system", "content": JARVIS_SYSTEM_PROMPT}]

        if message.history:
            messages.extend(message.history[-20:])

        messages.append({"role": "user", "content": message.message})

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=2048
        )

        reply = response.choices[0].message.content

        return ChatResponse(
            response=reply,
            tips=["Practice speaking clearly", "Maintain eye contact"],
            score=8
        )
    except Exception as e:
        return ChatResponse(response=f"Error: {str(e)}")


@router.get("/api/health")
async def health_check():
    return {"status": "online", "name": "JARVIS"}
