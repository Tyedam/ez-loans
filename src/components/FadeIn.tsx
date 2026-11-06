import { useEffect, useState, type ReactNode } from 'react'

type FadeInProps = {
  delay: number
  duration: number
  className?: string
  children: ReactNode
}

export function FadeIn({ delay, duration, className, children }: FadeInProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(true), delay)
    return () => window.clearTimeout(timeout)
  }, [delay])

  return (
    <div
      className={`transition-opacity ${className ?? ''}`}
      style={{ opacity: visible ? 1 : 0, transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}
