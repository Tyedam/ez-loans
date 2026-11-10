import { useEffect, useState } from 'react'

const CHAR_DELAY = 30
const START_DELAY = 200

export type HeadingLine = {
  text: string
  /** Set the line in the italic serif face. */
  serif?: boolean
}

type AnimatedHeadingProps = {
  lines: readonly HeadingLine[]
  className?: string
}

/** Splits each line into words of timed characters so words never break mid-letter. */
function timeCharacters(lines: readonly HeadingLine[]) {
  let position = 0
  return lines.map((line) => ({
    serif: line.serif ?? false,
    words: line.text.split(' ').map((word) => {
      const chars = word.split('').map((char) => ({ char, delay: position++ * CHAR_DELAY }))
      position += 1
      return chars
    }),
  }))
}

export function AnimatedHeading({ lines, className }: AnimatedHeadingProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(true), START_DELAY)
    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <h1
      className={`text-[2.5rem] font-normal leading-[1.05] sm:text-6xl lg:text-7xl ${className ?? ''}`}
      style={{ letterSpacing: '-0.03em' }}
      aria-label={lines.map((line) => line.text).join(' ')}
    >
      {timeCharacters(lines).map((line, lineIndex) => (
        <span key={lineIndex} className={`block ${line.serif ? 'serif-em' : ''}`} aria-hidden="true">
          {line.words.map((word, wordIndex) => (
            <span key={wordIndex}>
              <span className="inline-block whitespace-nowrap">
                {word.map(({ char, delay }, charIndex) => (
                  <span
                    key={charIndex}
                    className="inline-block"
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? 'translateX(0)' : 'translateX(-18px)',
                      transition: 'opacity 500ms, transform 500ms',
                      transitionDelay: `${delay}ms`,
                    }}
                  >
                    {char}
                  </span>
                ))}
              </span>
              {wordIndex < line.words.length - 1 ? ' ' : null}
            </span>
          ))}
        </span>
      ))}
    </h1>
  )
}
