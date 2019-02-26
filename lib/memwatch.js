import { logger, getHeapStats } from './utils'

let memwatch

export function fakeMemwatch() {
  return {
    _faked: true,
    _hasGC: typeof global.gc === 'function',
    HeapDiff: function () {
      logger.warn('Creating heap diffs in only supported when peerDependency node-memwatch is installed')
      this.end = () => {}
    },
    gc() {
      if (this._hasGC) {
        global.gc()
      } else {
        logger.warn('You need to run node either with --expose_gc or install peerDependency node-memwatch to force the garbage collector to run')
      }
    },
    on(event, callback) {
      if (event !== 'stats') {
        return
      }

      let statCounter = 0
      setInterval(() => {
        const stats = getHeapStats()
        stats.gcMarkSweepCompactCount = ++statCounter
        callback(stats)
      }, 1000)
    }
  }
}

export async function loadMemwatch() {
  if (memwatch) {
    return memwatch
  }

  memwatch = await import('@airbnb/node-memwatch')
    .then(m => m.default)
    .catch(e => false)

  if (!memwatch) {
    memwatch = fakeMemwatch()
  }

  return memwatch
}

export async function getMemwatch() {
  if (!memwatch) {
    await loadMemwatch()
  }

  return memwatch
}
