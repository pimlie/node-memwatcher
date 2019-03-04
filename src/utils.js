import v8 from 'v8'
import consola from 'consola'
import { mean } from 'simple-statistics'
import { defaultOptions } from './constants'

export const logger = consola.withTag('memwatch')

if (logger.level < 4) {
  logger.level = 4
}

let heapMin = Infinity
let heapMax = 0
const ancientHeapSizes = []

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

export function getHeapStats(stats) {
  if (!stats) {
    stats = v8.getHeapStatistics()
  }

  // calculate usage_trend similar as memwatch
  ancientHeapSizes.push(stats.used_heap_size)
  ancientHeapSizes.splice(0, ancientHeapSizes.length - 120)

  const ancientHeapSize = mean(ancientHeapSizes)
  const recentHeapSize = mean(ancientHeapSizes.slice(-10))

  stats.usage_trend = Math.round(10 * (recentHeapSize - ancientHeapSize) / ancientHeapSize) / 10
  stats.min_heap_size = heapMin = Math.min(heapMin, stats.total_heap_size)
  stats.max_heap_size = heapMax = Math.max(heapMax, stats.total_heap_size)

  return stats
}

export function startStatsInterval(callback) {
  const hasCallback = typeof callback === 'function'

  let statCounter = 0
  return setInterval(() => {
    const stats = getHeapStats()
    stats.gcMarkSweepCompactCount = ++statCounter

    if (hasCallback) {
      callback(stats)
    }
  }, 1000)
}
