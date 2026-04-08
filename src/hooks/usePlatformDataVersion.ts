import { useSyncExternalStore } from 'react'
import { subscribePlatformData } from '../data/storeEvents'

let version = 0

function getSnapshot() {
  return version
}

function subscribe(callback: () => void) {
  return subscribePlatformData(() => {
    version += 1
    callback()
  })
}

export function usePlatformDataVersion() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
