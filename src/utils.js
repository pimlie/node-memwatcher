import consola from 'consola'
import { defaultOptions } from './constants'

export const logger = consola.withTag('memwatch')

if (logger.level < 4) {
  logger.level = 4
}

export function setOptions(options = {}) {
  /* istanbul ignore next */
  if (options.__mw_checked) {
    return options
  }

  options.__mw_checked = true

  for (const key in defaultOptions) {
    if (options[key] === undefined) {
      options[key] = defaultOptions[key]
    } else if (key === 'heapAverages') {
      // normalize heapAverages option
      if (!Array.isArray(options[key])) {
        options[key] = [options[key]]
      }

      // remove empty values
      options[key] = options[key].filter(c => !!c && c > 1)
      // sort from low to high
      options[key].sort((a, b) => (a - b))
    } else if (key === 'graphSetup' || key === 'graphAddMetric') {
      if (!Array.isArray(options[key])) {
        if (typeof options[key] === 'function') {
          options[key] = [ options[key] ]
        } else {
          logger.warn(`${key} expects an array of functions`)
          options[key] = []
        }
      } else {
        options[key] = options[key].filter(fn => typeof fn === 'function')
      }
    }
  }

  options.maxHeapCount = Math.max(...options.heapAverages)

  if (options.heapDiffOnInterrupt && options.autoHeapDiff) {
    options.autoHeapDiff = false
    logger.warn('autoHeapDiff has been disabled as it conflicts with heapDiffOnInterrupt: true')
  }

  if (options.graph && options.autoHeapDiff) {
    options.autoHeapDiff = false
    logger.warn('autoHeapDiff has been disabled as it conflicts with graph: true')
  }

  if (options.graph && options.useMovingAverage) {
    options.useMovingAverage = 0
    logger.warn('useMovingAverage is ignored with graph: true')
  }

  return options
}

export function sortHeapDiffDetails(a, b) {
  if (b.size_bytes !== a.size_bytes) {
    return b.size_bytes - a.size_bytes
  }

  // what should be unique
  return a.what > b.what ? 1 : -1
}
