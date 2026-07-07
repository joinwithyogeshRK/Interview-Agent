'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { BsRobot } from 'react-icons/bs'

export default memo(function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-end mb-4"
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-jarvis-blue/30 to-jarvis-glow/30 border border-jarvis-blue/50 flex items-center justify-center">
          <BsRobot className="text-jarvis-blue" />
        </div>
        <div className="bg-jarvis-dark/80 border border-jarvis-blue/20 rounded-2xl p-4">
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        </div>
      </div>
    </motion.div>
  )
})
