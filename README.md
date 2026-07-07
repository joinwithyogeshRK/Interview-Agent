# JARVIS - AI Communication Coach

A Tony Stark-inspired AI assistant to help you improve your communication skills.

## Features

- **Real-time Chat** - WebSocket-based streaming responses
- **Voice Input** - Speech-to-text using browser's Web Speech API
- **Voice Output** - Text-to-speech for JARVIS responses
- **Beautiful UI** - Jarvis-style interface with arc reactor animations
- **Multiple Modes** - Conversation practice, public speaking, business communication

## Tech Stack

**Backend:**
- Python + FastAPI
- Groq API (LLaMA 3)
- WebSocket for real-time communication

**Frontend:**
- Next.js 14
- Tailwind CSS
- Framer Motion for animations

## Setup Instructions

### 1. Get Groq API Key
1. Go to https://console.groq.com
2. Sign up and get your API key
3. Add it to `backend/.env`

### 2. Setup Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Add your API key
echo "GROQ_API_KEY=your_key_here" > .env

# Run the server
python main.py
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Open Browser
Go to http://localhost:3000

## Usage

1. **Type a message** and press Enter to chat
2. **Click the mic button** to use voice input
3. **JARVIS will respond** with text and optional voice

## Communication Modes

Ask JARVIS to help with:
- "Help me practice a job interview"
- "Give me tips for public speaking"
- "How to write a professional email"
- "Help me improve my conversation skills"
- "Teach me business negotiation"

## Project Structure

```
jarvis-agent/
├── backend/
│   ├── main.py          # FastAPI server
│   ├── requirements.txt # Python dependencies
│   └── .env            # API keys
├── frontend/
│   ├── app/
│   │   ├── page.js     # Main chat interface
│   │   ├── layout.js   # App layout
│   │   └── globals.css # Jarvis styles
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## License

MIT
