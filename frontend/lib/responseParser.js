const SEGMENT_TYPES = {
  POSITIVE: 'positive',
  GRAMMAR: 'grammar',
  INSIGHT: 'insight',
  ACTION: 'action',
  ENCOURAGEMENT: 'encouragement',
  GENERAL: 'general'
}

const GRAMMAR_KEYWORDS = [
  'grammar note:',
  'grammar:',
  'correction:',
  'corrected:',
  'should be',
  'should have',
  'instead of',
  'you said',
  'mistake:',
  'error:'
]

const INSIGHT_KEYWORDS = [
  'psychological',
  'insight',
  'emotion',
  'feeling',
  'struggling',
  'pattern',
  'mindset',
  'fear',
  'anxiety',
  'confidence',
  'nervous',
  'overthinking',
  'subconscious',
  'mental'
]

const ACTION_KEYWORDS = [
  'action:',
  'practice:',
  'try this:',
  'do this:',
  'here is what',
  'here\'s what',
  'one thing',
  'specific:',
  'technique:',
  'drill:',
  'exercise:',
  'step 1',
  'start with'
]

const ENCOURAGEMENT_KEYWORDS = [
  'you got this',
  'you can do',
  'keep going',
  'great job',
  'awesome',
  'excellent',
  'well done',
  'proud',
  'believe',
  'strength',
  'capable'
]

function findKeywordMatch(text, keywords) {
  const lowerText = text.toLowerCase()
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return keyword
    }
  }
  return null
}

function detectSegmentType(text, prevSegmentType) {
  const trimmed = text.trim()

  if (findKeywordMatch(trimmed, GRAMMAR_KEYWORDS)) {
    return SEGMENT_TYPES.GRAMMAR
  }

  if (findKeywordMatch(trimmed, INSIGHT_KEYWORDS)) {
    return SEGMENT_TYPES.INSIGHT
  }

  if (findKeywordMatch(trimmed, ACTION_KEYWORDS)) {
    return SEGMENT_TYPES.ACTION
  }

  if (findKeywordMatch(trimmed, ENCOURAGEMENT_KEYWORDS)) {
    return SEGMENT_TYPES.ENCOURAGEMENT
  }

  return prevSegmentType || SEGMENT_TYPES.GENERAL
}

export function parseResponse(text) {
  if (!text) return []

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0)

  const segments = []
  let currentSegment = null
  let lastType = SEGMENT_TYPES.GENERAL

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (!trimmed) continue

    const detectedType = detectSegmentType(trimmed, lastType)

    if (!currentSegment || currentSegment.type !== detectedType) {
      if (currentSegment) {
        segments.push(currentSegment)
      }
      currentSegment = {
        type: detectedType,
        text: trimmed
      }
    } else {
      currentSegment.text += ' ' + trimmed
    }

    lastType = detectedType
  }

  if (currentSegment) {
    segments.push(currentSegment)
  }

  if (segments.length === 0) {
    segments.push({
      type: SEGMENT_TYPES.GENERAL,
      text: text
    })
  }

  return segments
}

export { SEGMENT_TYPES }
