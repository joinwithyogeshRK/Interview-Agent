'use client'

import { useChat } from '../hooks/useChat'
import Header from '../components/Header'
import ChatArea from '../components/ChatArea'
import ChatInput from '../components/ChatInput'
import BackgroundEffects from '../components/BackgroundEffects'

export default function Home() {
  const {
    messages,
    isTyping,
    isListening,
    isSpeaking,
    toggleVoice
  } = useChat()

  return (
    <div className="min-h-screen bg-jarvis-darker overflow-hidden">
      <BackgroundEffects />

      <div className="chat-container">
        <Header />

        <ChatArea messages={messages} isTyping={isTyping} />

        <ChatInput
          onToggleVoice={toggleVoice}
          isListening={isListening}
          isTyping={isTyping}
          isSpeaking={isSpeaking}
        />
      </div>
    </div>
  )
}
