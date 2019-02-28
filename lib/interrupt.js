import env from 'std-env'
import { getMemwatch } from './memwatch'
import { startHeapDiff, endHeapDiff } from './start'

export function doStartDiff() {
  listenInterrupt(doEndDiff)

  startHeapDiff()
}

export function doEndDiff() {
  listenInterrupt(doStartDiff)

  endHeapDiff(true)
}

export async function doGC() {
  const memwatch = await getMemwatch()
  memwatch.gc()

  listenInterrupt(doGC)
}

export function listenInterrupt(listener) {
  if (!listener) {
    listener = doStartDiff
  }

  // TODO: check why SIGINT hides app in console while app keeps running
  const signal = env.win ? 'SIGBREAK' : 'SIGUSR2'
  process.once(signal, listener)
}
