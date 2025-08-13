// Adapter lookup/registry/auto-detect
import * as webull from './adapters/webull'
import * as robinhood from './adapters/robinhood'
// import others as you add them
const registry = [webull, robinhood]

export function autoDetectAdapter(headers: string[], allowManual = false) {
  let best = registry[0], bestScore = 0
  for (const a of registry) {
    const conf = a.detect(headers)
    if (conf > bestScore) {
      best = a; bestScore = conf
    }
  }
  return { detected: best, confidence: bestScore, all: registry }
}
