'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { parseResponse, SEGMENT_TYPES } from '../lib/responseParser'

const segmentStyles = {
  [SEGMENT_TYPES.POSITIVE]: {
    bg: 'bg-emerald-500/10',
    border: 'border-l-emerald-500',
    text: 'text-emerald-200',
    label: 'Positive'
  },
  [SEGMENT_TYPES.GRAMMAR]: {
    bg: 'bg-amber-500/10',
    border: 'border-l-amber-500',
    text: 'text-amber-200',
    label: 'Grammar'
  },
  [SEGMENT_TYPES.INSIGHT]: {
    bg: 'bg-purple-500/10',
    border: 'border-l-purple-500',
    text: 'text-purple-200',
    label: 'Insight'
  },
  [SEGMENT_TYPES.ACTION]: {
    bg: 'bg-cyan-500/10',
    border: 'border-l-cyan-500',
    text: 'text-cyan-200',
    label: 'Action'
  },
  [SEGMENT_TYPES.ENCOURAGEMENT]: {
    bg: 'bg-pink-500/10',
    border: 'border-l-pink-500',
    text: 'text-pink-200',
    label: 'Encouragement'
  },
  [SEGMENT_TYPES.GENERAL]: {
    bg: 'bg-white/5',
    border: 'border-l-jarvis-blue/50',
    text: 'text-white/90',
    label: ''
  }
}

function FormattedMessage({ text }) {
  const segments = parseResponse(text)

  return (
    <div className="space-y-2">
      {segments.map((segment, index) => {
        const style = segmentStyles[segment.type] || segmentStyles[SEGMENT_TYPES.GENERAL]

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className={`${style.bg} border-l-2 ${style.border} pl-3 py-2 rounded-r-lg`}
          >
            {style.label && (
              <span className={`text-xs font-semibold uppercase tracking-wider ${style.text} opacity-70 block mb-1`}>
                {style.label}
              </span>
            )}
            <p className={`${style.text} leading-relaxed`}>{segment.text}</p>
          </motion.div>
        )
      })}
    </div>
  )
}

export default memo(FormattedMessage)
