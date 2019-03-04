import { mean } from 'simple-statistics'
import { getHeader, getStats, getHeapAverages } from './formatting'
import { addMetrics, setGraphMessage } from './graph'
import { listenInterrupt, doGC } from './interrupt'
import { getMemwatch } from './memwatch'
import { logger, setOptions, getHeapStats, startStatsInterval } from './utils'
import { startHeapDiff, endHeapDiff, clearHeapDiff } from './heapdiff'

export default async function start(options = {}) {
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
