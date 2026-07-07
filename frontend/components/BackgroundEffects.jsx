'use client'

import { useMemo } from 'react'

export default function BackgroundEffects() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 15,
      duration: 15 + Math.random() * 10,
    })),
  [])

  return (
    <>
      <div className="arc-reactor"></div>
      <div className="holo-grid"></div>

      {particles.map((p, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`
          }}
        />
      ))}
    </>
  )
}
