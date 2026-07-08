'use client'

import { useEffect, useState, memo } from 'react'
import { motion } from 'framer-motion'
import { BsRobot, BsMic, BsMicMute } from 'react-icons/bs'
import { FiWifi, FiClock } from 'react-icons/fi'

export default memo(function Header({ isMicOn, onToggleMic }) {
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative z-20 p-4 border-b border-jarvis-blue/20 bg-jarvis-darker/80 backdrop-blur-sm"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-2 border-jarvis-blue flex items-center justify-center"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-jarvis-blue/50 to-jarvis-glow/50 flex items-center justify-center">
              <BsRobot className="text-white text-lg" />
            </div>
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold glow-text">JARVIS</h1>
            <p className="text-jarvis-blue text-sm">Communication Coach v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-jarvis-blue/70">
          <div className="flex items-center gap-2">
            <FiClock />
            <span className="font-mono">{currentTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <FiWifi />
            <span>Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={isMicOn ? 'status-online' : 'status-offline'}></div>
            <span>{isMicOn ? 'Online' : 'Offline'}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleMic}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              isMicOn
                ? 'bg-jarvis-blue/20 border border-jarvis-blue/50 text-jarvis-blue'
                : 'bg-red-500/20 border border-red-500/50 text-red-400'
            }`}
          >
            {isMicOn ? (
              <>
                <BsMic className="text-lg" />
                <span className="text-sm font-medium">Mic On</span>
              </>
            ) : (
              <>
                <BsMicMute className="text-lg" />
                <span className="text-sm font-medium">Mic Off</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
})
