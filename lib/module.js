import env from 'std-env'
import { mean, getHeader, getStats, getHeapAverages } from './formatting'
import { logger, setOptions, startHeapDiff, endHeapDiff, clearHeapDiff, getHeapStats } from './utils'
import { listenInterrupt, doGC } from './interrupt'
import { addMetrics, setGraphMessage } from './graph'
import { getMemwatch } from './memwatch'

export default function nuxtMemwatch(options = {}) {
  let previousHeapSize

  const averageGrowth = []
  let consecutiveGrowth = 0
  let lineCounter
  let requestCounter = 0

  if (!env.tty) {
    logger.info('No tty found, nuxt-memwatch will not run')
    return
  }

  this.nuxt.hook('ready', async () => {
    const memwatch = await getMemwatch()

    if (memwatch._faked) {
      logger.info(`Please install peerDependency node-memwatch to unlock all of this module's features`)
    }

    options = setOptions(this.options.memwatch || options)

    if (options.gcAfterEvery || options.graph) {
      this.nuxt.hook('render:routeDone', () => {
        requestCounter++

        if (options.gcAfterEvery && requestCounter >= options.gcAfterEvery) {
          memwatch.gc()
          requestCounter = 0
        }
      })
    }

    if (options.graph && !options.graphOnGC) {
      // set interval to add metrics to the graph
      // we could also wait for memwatch.stats events to update the graph
      // but as the graph updates independently every second as well
      // it might be better to just align those updates
      setInterval(() => {
        // TODO: requestCounter is wrong when gcAfterEvery is enabled
        addMetrics(options, getHeapStats(), requestCounter)
        requestCounter = 0
      }, 1000)
    }

    // gcOnInterrupt is default behaviour
    if (options.heapDiffOnInterrupt) {
      listenInterrupt()
    } else if (options.gcOnInterrupt) {
      listenInterrupt(doGC)
    }

    // if neither options are set there is no use to add the nuxt hook
    // maybe the user only wanted to run the gc() above
    if (!options.verbose && !options.autoHeapDiff) {
      return
    } else if (options.autoHeapDiff && !this.options.dev) {
      logger.warn(`Creating heapDiffs is very expensive, only enable this in production if you really have to`)
    }

    this.nuxt.hook(options.nuxtHook, () => {
      logger.success('Memwatch is listening for gc stat events')

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
          if (options.graphOnGC) {
            addMetrics(options, stats, requestCounter)
            requestCounter = 0
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
    })
  })

  let renderCounter = 0
  this.nuxt.hook('render:routeDone', (url, res) => {
    this.nuxt.log = this.nuxt.log || []
    this.nuxt.log.push(res)

    if (renderCounter > 17000) {
      this.nuxt.log = undefined
      renderCounter = 0
    }

    renderCounter++
  })
}
