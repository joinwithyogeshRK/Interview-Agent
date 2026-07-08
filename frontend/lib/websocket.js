const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://interview-agent.up.railway.app/ws/chat'
const MAX_RECONNECT_ATTEMPTS = 5
const BASE_RECONNECT_DELAY = 3000

export function createWebSocket(onMessage, onConnect, onDisconnect) {
  let reconnectAttempts = 0
  let reconnectTimer = null
  let destroyed = false

  function connect() {
    if (destroyed) return

    const ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      reconnectAttempts = 0
      onConnect?.()
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      onMessage(data)
    }

    ws.onclose = () => {
      if (destroyed) return
      onDisconnect?.()
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = BASE_RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts)
        reconnectAttempts++
        reconnectTimer = setTimeout(() => {
          if (!destroyed) {
            const newWs = connect()
            Object.assign(ws, { _replacement: newWs })
          }
        }, delay)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return ws
  }

  const ws = connect()

  ws.close = ((originalClose) => {
    return function () {
      destroyed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      try { originalClose.call(ws) } catch (e) {}
    }
  })(ws.close.bind(ws))

  return ws
}

export function sendMessage(ws, content) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'text', content }))
    return true
  }
  return false
}
