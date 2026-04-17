type Listener = () => void

const listeners = new Set<Listener>()

export function subscribePlatformData(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyPlatformDataChange(): void {
  for (const listener of listeners) {
    listener()
  }
}
