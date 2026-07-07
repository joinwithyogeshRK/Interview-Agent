'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { BsRobot, BsPerson } from 'react-icons/bs'
import { stripMarkdown } from '../lib/speech'
import FormattedMessage from './FormattedMessage'

export default memo(function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const displayText = isUser ? message.content : stripMarkdown(message.content)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`message mb-4 flex ${isUser ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`flex gap-3 max-w-[80%] ${isUser ? '' : 'flex-row-reverse'}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/50'
            : 'bg-gradient-to-br from-jarvis-blue/30 to-jarvis-glow/30 border border-jarvis-blue/50'
        }`}>
          {isUser ? <BsPerson className="text-purple-400" /> : <BsRobot className="text-jarvis-blue" />}
        </div>
        <div className={`rounded-2xl p-4 ${
          isUser
            ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30'
            : 'bg-jarvis-dark/80 border border-jarvis-blue/20 glow-border'
        }`}>
          {isUser ? (
            <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{displayText}</p>
          ) : (
            <FormattedMessage text={displayText} />
          )}
          {message.streaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-jarvis-blue animate-pulse"></span>
          )}
        </div>
      </div>
    </motion.div>
  )
})
