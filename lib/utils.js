import v8 from 'v8'
import consola from 'consola'
import { defaultOptions } from './constants'
import { getMemwatch } from './memwatch'
import { mean } from './formatting'

let heapDiff
let heapMin = Infinity
let heapMax = 0
const ancientHeapSizes = []

export const logger = consola.withTag('memwatch')

if (logger.level < 4) {
  logger.level = 4
}

export function setOptions(options) {
  for (const key in defaultOptions) {
    if (!options[key]) {
      options[key] = defaultOptions[key]
    } else if (key === 'heapAverages') {
      // normalize heapAverages option
      if (!Array.isArray(options[key])) {
        options[key] = [options[key]]
      }

      // remove empty values
      options[key] = options[key].filter(c => !!c && c > 1)
      // add 1 for current value
      options[key].unshift(1)
      // sort from low to high
      options[key].sort((a, b) => (a - b))
    }
  }

  options.maxHeapCount = Math.max(...options.heapAverages)

  if (options.heapDiffOnInterrupt && options.autoHeapDiff) {
    options.autoHeapDiff = false
    logger.warn('autoHeapDiff has been disabled as heapDiffOnInterrupt is set')
  }

  return options
}

export function startHeapDiff() {
  logger.info('Dumping first heap (could take a while)')

  const memwatch = getMemwatch()

  // TODO: Check if we can do this with node built-in tools, e.g. chrome devtools protocol?
  heapDiff = new memwatch.HeapDiff()
}

export function endHeapDiff(printStats) {
  if (!heapDiff) {
    return false
  }

  logger.info('Dumping second heap and create diff (could take a while)')
  const diffStats = heapDiff.end()

  if (printStats) {
    // TODO: make this pretty
    /* eslint-disable no-console */
    console.log('before', diffStats.before)
    console.log('after', diffStats.after)
    const details = diffStats.change.details
    delete diffStats.change.details
    console.log('change', diffStats.change)
    console.log('details', details)
    /* eslint-enable no-console */
  }

  return diffStats
}

export function clearHeapDiff() {
  if (heapDiff) {
    heapDiff = undefined
  }
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
