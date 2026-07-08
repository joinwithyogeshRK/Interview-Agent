'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createWebSocket, sendMessage } from '../lib/websocket'
import { speak, initVoices, stopListening } from '../lib/speech'
import { startListening } from '../lib/speech'

const API_URL = '/api/chat'
const TYPING_TIMEOUT = 30000

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hi sir! Good to see you! How are you doing today? I hope you're having a wonderful day! What would you like to practice?",
  spoken: false
}

export function useChat() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMicOn, setIsMicOn] = useState(true)
  const wsRef = useRef(null)
  const conversationHistory = useRef([])
  const messageCount = useRef(1)
  const isTypingRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const isMicOnRef = useRef(true)
  const listeningActive = useRef(false)
  const abortControllerRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const mountedRef = useRef(true)

  useEffect(() => { isTypingRef.current = isTyping }, [isTyping])
  useEffect(() => { isSpeakingRef.current = isSpeaking }, [isSpeaking])
  useEffect(() => { isMicOnRef.current = isMicOn }, [isMicOn])

  useEffect(() => {
    const cleanup = initVoices()
    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    const welcomeSpoken = sessionStorage.getItem('jarvis_welcome_spoken')
    if (!welcomeSpoken) {
      const timer = setTimeout(async () => {
        setIsSpeaking(true)
        await speak(WELCOME_MESSAGE.content)
        if (mountedRef.current) {
          setIsSpeaking(false)
          sessionStorage.setItem('jarvis_welcome_spoken', 'true')
        }
      }, 1000)
      return () => {
        clearTimeout(timer)
        mountedRef.current = false
      }
    }
    return () => { mountedRef.current = false }
  }, [])

  const clearTypingTimeout = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }, [])

  const resumeListening = useCallback(() => {
    if (!isMicOnRef.current || listeningActive.current) return
    listeningActive.current = true
    setIsListening(true)
    startListening(null, (finalTranscript) => {
      if (finalTranscript.trim() && !isTypingRef.current && !isSpeakingRef.current && isMicOnRef.current) {
        handleSend(finalTranscript)
      }
    }, null, null, (active) => {
      listeningActive.current = active
      if (mountedRef.current) setIsListening(active)
    })
  }, [])

  const pauseListening = useCallback(() => {
    listeningActive.current = false
    setIsListening(false)
    stopListening()
  }, [])

  const toggleMic = useCallback(() => {
    setIsMicOn(prev => {
      const newState = !prev
      if (newState) {
        setTimeout(() => resumeListening(), 100)
      } else {
        pauseListening()
      }
      return newState
    })
  }, [resumeListening, pauseListening])

  const handleSend = useCallback(async (text) => {
    if (!text || !text.trim() || !isMicOnRef.current) return

    const userMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    clearTypingTimeout()
    typingTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setIsTyping(false)
        typingTimeoutRef.current = null
      }
    }, TYPING_TIMEOUT)

    conversationHistory.current.push({ role: 'user', content: text })
    if (conversationHistory.current.length > 20) {
      conversationHistory.current = conversationHistory.current.slice(-20)
    }

    const sentViaWs = sendMessage(wsRef.current, text)
    if (sentViaWs) return

    if (abortControllerRef.current) abortControllerRef.current.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          mode: 'conversation',
          history: conversationHistory.current
        }),
        signal: controller.signal
      })

      if (!response.ok) throw new Error(`Chat failed: ${response.status}`)

      const data = await response.json()

      clearTypingTimeout()

      conversationHistory.current.push({ role: 'assistant', content: data.response })
      if (conversationHistory.current.length > 20) {
        conversationHistory.current = conversationHistory.current.slice(-20)
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      setIsTyping(false)

      if (isMicOnRef.current) {
        setIsSpeaking(true)
        pauseListening()
        await speak(data.response)
        if (mountedRef.current) {
          setIsSpeaking(false)
          if (isMicOnRef.current) {
            resumeListening()
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') return
      console.error('Error:', error)
      clearTypingTimeout()
      if (mountedRef.current) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }])
        setIsTyping(false)
      }
    }
  }, [resumeListening, pauseListening, clearTypingTimeout])

  useEffect(() => {
    wsRef.current = createWebSocket(
      (data) => {
        if (!mountedRef.current) return
        if (data.type === 'stream') {
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (last.role === 'assistant' && last.streaming) {
              return [...prev.slice(0, -1), { ...last, content: last.content + data.content }]
            }
            return [...prev, { role: 'assistant', content: data.content, streaming: true }]
          })
        } else if (data.type === 'complete') {
          const fullResponse = data.content
          clearTypingTimeout()
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (last.streaming) {
              return [...prev.slice(0, -1), { ...last, streaming: false }]
            }
            return prev
          })
          setIsTyping(false)

          if (isMicOnRef.current) {
            setIsSpeaking(true)
            pauseListening()
            speak(fullResponse).then(() => {
              if (mountedRef.current) {
                setIsSpeaking(false)
                if (isMicOnRef.current) {
                  resumeListening()
                }
              }
            })
          }
        }
      },
      () => console.log('WS connected'),
      () => console.log('WS disconnected')
    )

    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [resumeListening, pauseListening, clearTypingTimeout])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMicOnRef.current) {
        resumeListening()
      }
    }, 1500)
    return () => {
      clearTimeout(timer)
      pauseListening()
    }
  }, [resumeListening, pauseListening])

  useEffect(() => {
    return () => {
      clearTypingTimeout()
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [clearTypingTimeout])

  return {
    messages,
    isTyping,
    isListening,
    isSpeaking,
    isMicOn,
    toggleMic
  }
}
