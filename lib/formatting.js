import cliui from 'cliui'
import chalk from 'chalk'
import { mean, standardDeviation } from 'simple-statistics'
import { memwatchHeader, heapHeader, heapHeaderPart } from './constants'

export { mean }

let previousStats = {}
const previousHeapSizes = []
const heapHeaders = []

export function humanNumber(num) {
  return Number.parseFloat(num / (1024 * 1024)).toFixed(2) + 'MB'
}

export function humanSeconds(time) {
  const timeSuffixes = ['s', 'ms', 'us', 'ns']
  let suffix

  while (time > 1000) {
    suffix = timeSuffixes.pop()
    time = time / 1000
  }
  return `${time.toFixed(1)}${suffix}`
}

export function prettyNumber(num, prev) {
  const hunum = humanNumber(num)

  if (num == prev || prev === undefined) { // eslint-disable-line eqeqeq
    return hunum
  }

  const color = num > prev ? 'green' : 'red'
  return chalk[color](hunum)
}

export function getHeader(options, stats) {
  const ui = cliui()

  const cols = []

  if (options.averages) {
    if (!heapHeaders.length) {
      heapHeaders.push(...heapHeader)

      if (stats.real_heap_size === undefined) {
        heapHeaders.pop()
      }

      options.heapAverages.forEach((heapCount) => {
        if (!heapCount || heapCount === 1) {
          return
        }

        const headerParts = [{
          ...heapHeaderPart.mean
        }, {
          ...heapHeaderPart.stddev
        }]

        headerParts[0].text += ` (${heapCount})`
        headerParts[1].text += ` (${heapCount})`

        heapHeaders.push(...headerParts)
      })
    }

    cols.push(...heapHeaders)
  } else {
    for (const key in memwatchHeader) {
      if (stats[key] === undefined) {
        continue
      }
      cols.push(memwatchHeader[key] || { text: key })
    }
  }

  ui.div(...cols.map((col) => {
    // always print headers in gray
    col.text = chalk.gray(col.text)
    return col
  }))
  return ui.toString()
}

export function getValue(col, key, val) {
  if (col.pretty) {
    return prettyNumber(val, previousStats[key])
  }

  if (col.number) {
    return humanNumber(val)
  }

  if (col.seconds) {
    return humanSeconds(val)
  }

  return val
}

export function getStatLine(stats) {
  const statLine = Object.keys(memwatchHeader).reduce((acc, key) => {
    if (stats[key] === undefined) {
      return acc
    }

    const val = getValue(memwatchHeader[key], key, stats[key])

    return `${acc}${acc ? ' ' : ''}${memwatchHeader[key].text || key}=${val}`
  }, '')

  previousStats = stats
  return statLine
}

export function getStats(options, stats) {
  const ui = cliui()

  const cols = []
  for (const key in memwatchHeader) {
    if (stats[key] === undefined) {
      continue
    }

    const col = {
      ...memwatchHeader[key]
    }

    col.text = getValue(col, key, stats[key])

    cols.push(col)
  }
  ui.div(...cols)

  previousStats = stats
  return ui.toString()
}

export function getHeapAverages(options, stats) {
  previousHeapSizes.push(stats.used_heap_size)

  // clean-up not used heap sizes
  previousHeapSizes.splice(0, previousHeapSizes.length - options.maxHeapCount)

  const ui = cliui()

  const cols = []
  cols.push(stats.gcMarkSweepCompactCount)
  cols.push(prettyNumber(stats.used_heap_size, previousStats.used_heap_size))

  if (stats.real_heap_size !== undefined) {
    cols.push(prettyNumber(stats.real_heap_size, previousStats.real_heap_size))
  }

  stats.mean = {}
  options.heapAverages.forEach((heapCount) => {
    if (previousHeapSizes.length >= heapCount) {
      const heapSizes = previousHeapSizes.slice(-1 * heapCount)

      stats.mean[heapCount] = mean(heapSizes)
      cols.push(prettyNumber(stats.mean[heapCount], previousStats.mean[heapCount]))
      cols.push(humanNumber(standardDeviation(heapSizes)))
    }
  })

  ui.div(...cols.map((colVal, index) => {
    const col = {
      ...heapHeaders[index]
    }

    col.text = colVal
    return col
  }))

  previousStats = stats
  return ui.toString()
}
