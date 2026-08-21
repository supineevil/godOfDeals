import { useEffect, useState } from 'react'
import { fetchVisitorCount30d } from '../lib/visitorCount'

export function useVisitorCount() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetchVisitorCount30d()
      .then(setCount)
      .catch(() => setCount(null))
  }, [])

  return count
}
