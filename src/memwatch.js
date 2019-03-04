import { logger, startStatsInterval } from './utils'

let memwatch

// provides a memwatch compatible api when the peerDependency is not installed
export function fakeMemwatch() {
  return {
    _faked: true,
    _hasGC: typeof global.gc === 'function',
    heapWarned: false,
    gcWarned: false,
    HeapDiff: function () {
      // TODO: Check if we can also do this with node built-in tools, e.g. chrome devtools protocol?
      this.end = () => {}

      if (!this.heapWarned) {
        logger.warn('Creating heap diffs is only supported when the peerDependency is installed')
        this.heapWarned = true
      }
    },
    gc() {
      if (this._hasGC) {
        /* istanbul ignore next line */
        global.gc()
      } else if (!this.gcWarned) {
        this.gcWarned = true
        logger.warn('You need to run node either with --expose_gc or install the peerDependency to force the garbage collector to run')
      }
    },
    on(event, callback) {
      if (event !== 'stats') {
        return
      }

      this._interval = startStatsInterval(callback)
    },
    off(event) {
      clearInterval(this._interval)
      this._interval = undefined
    }
  }
}

export async function loadMemwatch() {
  try {
    memwatch = await import('@airbnb/node-memwatch').then(m => m.default || m)
  } catch (e) {}

  /* istanbul ignore next */
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
