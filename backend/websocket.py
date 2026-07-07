from fastapi import WebSocket, WebSocketDisconnect
import json
from groq_client import client
from config import GROQ_MODEL, JARVIS_SYSTEM_PROMPT


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)


manager = ConnectionManager()


async def handle_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    conversation_history = [
        {"role": "system", "content": JARVIS_SYSTEM_PROMPT}
    ]

    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            if message_data["type"] == "text":
                conversation_history.append({"role": "user", "content": message_data["content"]})

                response = client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=conversation_history,
                    temperature=0.7,
                    max_tokens=1024,
                    stream=True
                )

                full_response = ""
                for chunk in response:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        full_response += content
                        await websocket.send_json({
                            "type": "stream",
                            "content": content
                        })

                conversation_history.append({"role": "assistant", "content": full_response})

                await websocket.send_json({
                    "type": "complete",
                    "content": full_response
                })

            elif message_data["type"] == "audio":
                await websocket.send_json({
                    "type": "audio_response",
                    "content": "Audio processing would go here"
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
