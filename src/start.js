import v8 from 'v8'
import { mean } from 'simple-statistics'
import { getHeader, getStats, getHeapAverages, getDiff } from './formatting'
import { addMetrics, setGraphMessage } from './graph'
import { listenInterrupt, doGC } from './interrupt'
import { getMemwatch } from './memwatch'
import { logger, setOptions } from './utils'

let heapDiff
let heapMin = Infinity
let heapMax = 0
const ancientHeapSizes = []

export async function startHeapDiff() {
  logger.info('Dumping first heap (could take a while)')

  const memwatch = await getMemwatch()

  heapDiff = new memwatch.HeapDiff()
  return heapDiff
}

export function endHeapDiff(printStats) {
  if (!heapDiff) {
    return false
  }

  logger.info('Dumping second heap and create diff (could take a while)')
  const diffStats = heapDiff.end()

  if (printStats) {
    logger.log(getDiff(diffStats))
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

export async function start(options = {}) {
  const memwatch = await getMemwatch()

  if (memwatch._faked) {
    logger.info(`Please install the peer dependency to unlock all of the features`)
  }

  options = setOptions(options)

  logger.success(`${options.appName} is listening for gc stat events`)

  if (options.graph && !options.gcMetrics) {
    // set interval to add metrics to the graph
    // we could also wait for memwatch.stats events to update the graph
    // but as the graph updates independently every second as well
    // it might be better to just align those updates
    startStatsInterval((stats) => {
      addMetrics(options, stats)
    })
  }

  // gcOnInterrupt is default behaviour
  if (options.heapDiffOnInterrupt) {
    listenInterrupt()
  } else if (options.gcOnInterrupt) {
    listenInterrupt(doGC)
  }

  // if neither options are set there is no use to proceed
  // maybe the user only wanted to add a interrupt listener above
  if (!options.verbose && !options.autoHeapDiff) {
    return
  } else if (options.autoHeapDiff && process.env.NODE_ENV === 'production') {
    logger.warn(`Creating heapDiffs is very expensive, only enable this in production if you really have to`)
  }

  const averageGrowth = []
  let previousHeapSize
  let consecutiveGrowth = 0
  let lineCounter

  memwatch.on('stats', (stats) => {
    getHeapStats(stats)

    if (!options.averages && options.useMovingAverage) {
      averageGrowth.push(stats.used_heap_size)
      averageGrowth.slice(averageGrowth.length - options.useMovingAverage)

      stats.real_heap_size = stats.used_heap_size
      stats.used_heap_size = mean(averageGrowth)
    }

    if (previousHeapSize && stats.used_heap_size > previousHeapSize) {
      consecutiveGrowth++
    } else {
      consecutiveGrowth = 0
    }

    previousHeapSize = stats.used_heap_size

    // if enabled we should've intiated a heapDiff at leakGrowthCount - 1
    if (consecutiveGrowth >= options.leakGrowthCount) {
      endHeapDiff(true)

      // reset
      consecutiveGrowth = 0
    } else if (options.autoHeapDiff && consecutiveGrowth >= (options.leakGrowthCount - 1)) {
      // memwatch defines a memleak as 5 consecutive growths
      // we implement the memleak detection here ourselves, so we can
      // start a heapDiff at 5 - 1 growths so we can better check what grows
      startHeapDiff()
    } else {
      clearHeapDiff()
    }

    if (!options.verbose) {
      return
    }

    if (options.graph) {
      if (options.gcMetrics) {
        addMetrics(options, stats)
      }

      setGraphMessage(stats)
      return
    }

    // print a header to console if needed
    if (lineCounter === undefined || lineCounter >= options.headerEveryLines) {
      logger.debug(getHeader(options, stats))
      lineCounter = 1
    } else {
      lineCounter++
    }

    if (options.averages) {
      logger.debug(getHeapAverages(options, stats))
    } else {
      logger.debug(getStats(options, stats))
    }
  })
}
