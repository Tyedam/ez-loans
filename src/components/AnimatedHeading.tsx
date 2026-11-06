import { useEffect, useState } from 'react'

const CHAR_DELAY = 30
const START_DELAY = 200

type AnimatedHeadingProps = {
  text: string
  className?: string
}

export function AnimatedHeading({ text, className }: AnimatedHeadingProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(true), START_DELAY)
    return () => window.clearTimeout(timeout)
  }, [])

  const lines = text.split('\n')

  return (
    <h1
      className={`mb-5 text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl ${className ?? ''}`}
      style={{ letterSpacing: '-0.03em' }}
    >
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} className="block">
          {line.split('').map((char, charIndex) => {
            const delay = lineIndex * line.length * CHAR_DELAY + charIndex * CHAR_DELAY
            return (
              <span
                key={`${lineIndex}-${charIndex}`}
                className="inline-block"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateX(0)' : 'translateX(-18px)',
                  transition: 'opacity 500ms, transform 500ms',
                  transitionDelay: `${delay}ms`,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            )
          })}
        </span>
      ))}
    </h1>
  )
}
