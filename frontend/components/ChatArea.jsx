'use client'

import { useRef, useEffect, memo } from 'react'
import { AnimatePresence } from 'framer-motion'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

export default memo(function ChatArea({ messages, isTyping }) {
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
      <AnimatePresence>
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id || message.content?.slice(0, 50) || index}
            message={message}
          />
        ))}
      </AnimatePresence>

      {isTyping && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  )
})
