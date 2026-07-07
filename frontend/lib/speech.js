const TTS_API = '/api/tts'
const SILENCE_TIMEOUT = 3000

let recognitionInstance = null
let silenceTimer = null
let accumulatedTranscript = ''
let shouldListen = false
let onFinalCallback = null
let onStatusCallback = null
let lastRestartTime = 0
let restartTimer = null

export function stripMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/---+/g, '.')
    .replace(/→/g, 'to')
    .replace(/←/g, 'from')
    .replace(/=>/g, 'to')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

let audioUnlocked = false

function unlockAudio() {
  if (audioUnlocked) return
  const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA')
  silent.play().then(() => {
    audioUnlocked = true
    document.removeEventListener('click', unlockAudio)
    document.removeEventListener('touchstart', unlockAudio)
  }).catch(() => {})
}

export function initVoices() {
  if (typeof window === 'undefined') return
  document.addEventListener('click', unlockAudio)
  document.addEventListener('touchstart', unlockAudio)

  return function cleanup() {
    document.removeEventListener('click', unlockAudio)
    document.removeEventListener('touchstart', unlockAudio)
  }
}

export function speak(text) {
  return new Promise(async (resolve) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    const cleanText = stripMarkdown(text)
      .replace(/\.\s*/g, ', ')
      .replace(/!\s*/g, ', ')
      .replace(/\?\s*/g, ', ')
      .replace(/;\s*/g, ', ')
      .replace(/:\s*/g, ', ')
      .replace(/,\s*,/g, ',')
      .trim()

    try {
      const response = await fetch(TTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText })
      })

      if (!response.ok) throw new Error(`TTS failed: ${response.status}`)

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.preload = 'auto'

      const cleanup = () => {
        URL.revokeObjectURL(url)
      }

      audio.onended = () => {
        cleanup()
        resolve()
      }
      audio.onerror = (e) => {
        console.error('Audio error:', e)
        cleanup()
        resolve()
      }

      try {
        await audio.play()
      } catch (playError) {
        console.warn('Autoplay blocked, waiting for user interaction:', playError)
        await new Promise((res) => {
          const retryPlay = async () => {
            document.removeEventListener('click', retryPlay)
            document.removeEventListener('touchstart', retryPlay)
            try {
              await audio.play()
            } catch (e) {
              console.error('Retry play failed:', e)
            }
            res()
          }
          document.addEventListener('click', retryPlay, { once: true })
          document.addEventListener('touchstart', retryPlay, { once: true })
        })
        resolve()
      }
    } catch (error) {
      console.error('TTS error:', error.message)
      resolve()
    }
  })
}

function clearRestartTimer() {
  if (restartTimer) {
    clearTimeout(restartTimer)
    restartTimer = null
  }
}

function scheduleRestart(delay) {
  clearRestartTimer()
  restartTimer = setTimeout(() => {
    restartTimer = null
    if (shouldListen && !recognitionInstance) {
      createAndStartRecognition()
    }
  }, delay)
}

function createAndStartRecognition() {
  if (!shouldListen) return

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) return

  const recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-IN'

  recognition.onresult = (event) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        accumulatedTranscript += transcript + ' '
      } else {
        interim += transcript
      }
    }

    clearTimeout(silenceTimer)
    silenceTimer = setTimeout(() => {
      if (accumulatedTranscript.trim() && onFinalCallback) {
        onFinalCallback(accumulatedTranscript.trim())
        accumulatedTranscript = ''
      }
    }, SILENCE_TIMEOUT)
  }

  recognition.onend = () => {
    recognitionInstance = null
    if (onStatusCallback) onStatusCallback(false)
    if (shouldListen) {
      scheduleRestart(300)
    }
  }

  recognition.onerror = (event) => {
    recognitionInstance = null
    if (onStatusCallback) onStatusCallback(false)
    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      console.error('Speech recognition error:', event.error)
    }
    if (shouldListen) {
      scheduleRestart(event.error === 'no-speech' ? 300 : 1000)
    }
  }

  recognitionInstance = recognition
  if (onStatusCallback) onStatusCallback(true)
  try {
    recognition.start()
  } catch (e) {
    console.error('Failed to start recognition:', e)
  }
}

export function startListening(onInterim, onFinal, onEnd, onError, onStatus) {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    alert('Speech recognition is not supported in your browser')
    return null
  }

  shouldListen = true
  onFinalCallback = onFinal
  onStatusCallback = onStatus || null
  accumulatedTranscript = ''

  if (!recognitionInstance) {
    createAndStartRecognition()
  }

  return recognitionInstance
}

export function stopListening() {
  shouldListen = false
  onFinalCallback = null
  onStatusCallback = null
  clearRestartTimer()
  clearTimeout(silenceTimer)

  if (recognitionInstance) {
    try { recognitionInstance.abort() } catch (e) {}
    recognitionInstance = null
  }
  accumulatedTranscript = ''
}
