from pydantic import BaseModel
from typing import List, Optional


class ChatMessage(BaseModel):
    message: str
    mode: str = "conversation"
    history: Optional[List[dict]] = None


class ChatResponse(BaseModel):
    response: str
    tips: list = []
    score: int = 0
