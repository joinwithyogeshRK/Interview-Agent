'use client'

import { useChat } from '../hooks/useChat'
import Header from '../components/Header'
import ChatArea from '../components/ChatArea'
import BackgroundEffects from '../components/BackgroundEffects'

export default function Home() {
  const {
    messages,
    isTyping,
    isListening,
    isSpeaking,
    isMicOn,
    toggleMic
  } = useChat()

  return (
    <div className="min-h-screen bg-jarvis-darker overflow-hidden">
      <BackgroundEffects />

      <div className="chat-container">
        <Header isMicOn={isMicOn} onToggleMic={toggleMic} />

        <ChatArea messages={messages} isTyping={isTyping} />
      </div>
    </div>
  )
}
