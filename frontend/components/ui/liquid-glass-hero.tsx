"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { stripMarkdown } from "../../lib/speech";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const LiquidGlassHero = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const autoListenRef = useRef(true);
  const accumulatedTranscriptRef = useRef("");
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isThinkingRef = useRef(false);
  const isSpeakingRef = useRef(false);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => { isThinkingRef.current = isThinking; }, [isThinking]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Video animation
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const cancelRaf = () => { if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const animateOpacity = (target: number, duration: number) => {
      cancelRaf();
      const start = performance.now();
      const from = parseFloat(video.style.opacity || "0");
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        video.style.opacity = String(from + (target - from) * t);
        if (t < 1) rafRef.current = requestAnimationFrame(step);
        else rafRef.current = null;
      };
      rafRef.current = requestAnimationFrame(step);
    };
    const fadeIn = () => { fadingOutRef.current = false; animateOpacity(1, 500); };
    const onLoadedData = () => { video.play().catch(() => {}); fadeIn(); };
    const onTimeUpdate = () => { if (!fadingOutRef.current && video.duration - video.currentTime <= 0.55) { fadingOutRef.current = true; animateOpacity(0, 500); } };
    const onEnded = () => { cancelRaf(); video.style.opacity = "0"; setTimeout(() => { video.currentTime = 0; video.play().catch(() => {}); fadeIn(); }, 100); };

    video.style.opacity = "0";
    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    if (video.readyState >= 2) { video.play().catch(() => {}); fadeIn(); }

    return () => {
      cancelRaf();
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  const handleUserMessage = useCallback(async (text: string) => {
    if (!text || !text.trim()) return;

    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: text }]);
    setIsThinking(true);
    autoListenRef.current = false;
    try { recognitionRef.current?.stop(); } catch (e) {}

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, mode: "conversation" }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
      const data = await res.json();
      const reply = data.response || "Could you repeat?";
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: reply }]);
      setIsThinking(false);
      speakText(reply);
    } catch (e: any) {
      if (e.name === "AbortError") return;
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: "Connection error." }]);
      setIsThinking(false);
      autoListenRef.current = true;
      try { recognitionRef.current?.start(); } catch (e) {}
    }
  }, []);

  const handleUserMessageRef = useRef(handleUserMessage);
  useEffect(() => { handleUserMessageRef.current = handleUserMessage; }, [handleUserMessage]);

  const startSendCountdown = useCallback(() => {
    if (!hasStarted) setHasStarted(true);
    if (sendTimeoutRef.current) clearInterval(sendTimeoutRef.current as unknown as NodeJS.Timeout);
    let seconds = 3;
    setCountdown(seconds);
    const interval = setInterval(() => {
      seconds--;
      setCountdown(seconds);
      if (seconds <= 0) {
        clearInterval(interval);
        sendTimeoutRef.current = null;
        const text = accumulatedTranscriptRef.current.trim();
        if (text && text.length > 2) handleUserMessageRef.current(text);
        accumulatedTranscriptRef.current = "";
        setTranscript("");
      }
    }, 1000);
    sendTimeoutRef.current = interval as unknown as NodeJS.Timeout;
  }, [hasStarted]);

  const startSendCountdownRef = useRef(startSendCountdown);
  useEffect(() => { startSendCountdownRef.current = startSendCountdown; }, [startSendCountdown]);

  // Speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) accumulatedTranscriptRef.current += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      setTranscript((accumulatedTranscriptRef.current + interim).trim());
      if (sendTimeoutRef.current) { clearTimeout(sendTimeoutRef.current); setCountdown(0); }
      if (accumulatedTranscriptRef.current.trim()) startSendCountdownRef.current();
    };

    recognition.onend = () => {
      setIsListening(false);
      if (autoListenRef.current && !isThinkingRef.current && !isSpeakingRef.current) {
        setTimeout(() => { try { recognition.start(); } catch (e) {} }, 100);
      }
    };

    recognition.onerror = () => {
      if (autoListenRef.current && !isThinkingRef.current && !isSpeakingRef.current) {
        setTimeout(() => { try { recognition.start(); } catch (e) {} }, 100);
      }
    };

    recognitionRef.current = recognition;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(s => { s.getTracks().forEach(t => t.stop()); recognition.start(); })
      .catch(() => {});

    return () => {
      try { recognition.abort(); } catch (e) {}
      recognitionRef.current = null;
    };
  }, []);

  const speakText = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(stripMarkdown(text));
    u.rate = 0.9; u.pitch = 1.2;
    const v = window.speechSynthesis.getVoices().find(v => v.name.includes("Samantha")) || window.speechSynthesis.getVoices().find(v => v.lang.includes("en-US"));
    if (v) u.voice = v;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => {
      setIsSpeaking(false);
      autoListenRef.current = true;
      accumulatedTranscriptRef.current = "";
      setTimeout(() => { try { recognitionRef.current?.start(); } catch (e) {} }, 300);
    };
    window.speechSynthesis.speak(u);
  }, []);

  const getStatusColor = () => { if (isListening) return "bg-red-500"; if (isSpeaking) return "bg-cyan-500"; if (isThinking) return "bg-yellow-500"; return "bg-green-500"; };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" src={VIDEO_URL} autoPlay muted playsInline loop={false} style={{ opacity: 0 }} />
      <div className="absolute inset-0 bg-black/40" />

      {/* Full screen conversation */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-8 md:px-16 lg:px-24 py-8" ref={messagesEndRef}>
          {!hasStarted && (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/30 text-lg">Start speaking to begin...</p>
            </div>
          )}

          {hasStarted && (
            <div className="max-w-6xl mx-auto space-y-8">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[45%] px-6 py-4 rounded-3xl ${
                    msg.role === "user"
                      ? "bg-white/10 backdrop-blur-md border border-white/20"
                      : "bg-cyan-500/10 backdrop-blur-md border border-cyan-500/20"
                  }`}>
                    <p className={`text-lg md:text-xl font-light leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user" ? "text-white/90" : "text-white"
                    }`}>
                      {msg.role === "user" ? msg.content : stripMarkdown(msg.content)}
                    </p>
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-end">
                  <div className="flex gap-2 px-6 py-4 rounded-3xl bg-cyan-500/10 backdrop-blur-md border border-cyan-500/20">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transcript when speaking */}
        {transcript && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 px-8 py-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 max-w-xl">
            <p className="text-white/80 text-lg italic text-center">&ldquo;{transcript}&rdquo;</p>
            {countdown > 0 && <p className="text-red-400 text-sm text-center mt-2">Sending in {countdown}s...</p>}
          </div>
        )}

        {/* Status bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-6 py-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isListening || isSpeaking ? 'animate-pulse' : ''}`} />
          <span className="text-white/50 text-sm">
            {isListening ? "Listening..." : isSpeaking ? "Speaking..." : isThinking ? "Thinking..." : "Ready"}
          </span>
        </div>
      </div>
    </div>
  );
};

export { LiquidGlassHero };
