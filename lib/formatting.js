import cliui from 'cliui'
import chalk from 'chalk'
import { mean, standardDeviation } from 'simple-statistics'
import { memwatchHeader, heapHeader, heapHeaderPart, diffHeader, diffDetailsHeader } from './constants'

let previousStats = {}
const previousHeapSizes = []
const heapHeaders = []

const prefixes = ['T', 'G', 'M', 'k']
const subprefixes = ['p', 'n', 'u', 'm']

export function humanNumber(num, unit = '', precision = 1, base = 1000) {
  let absNum = Math.abs(parseFloat(num))
  let prefix = ''

  if (absNum >= base) {
    const _prefixes = Array.from(prefixes)

    while (absNum > base) {
      prefix = _prefixes.pop()

      num = num / base
      absNum = Math.abs(num)
    }
  } else if (absNum > 0 && absNum <= 1) {
    const _prefixes = Array.from(subprefixes)

    while (absNum < 1) {
      prefix = _prefixes.pop()

      num = num * base
      absNum = Math.abs(num)
    }
  }

  return `${num.toFixed(precision)}${prefix || unit ? ' ' : ''}${prefix}${unit}`
}

export function humanBytes(num) {
  return humanNumber(num, 'B', 2)
}

export function humanSeconds(time) {
  return humanNumber(time, 's')
}

export function coloredNumber(num, cur, prev) {
  if (cur == prev || prev === undefined) { // eslint-disable-line eqeqeq
    return num
  }

  const color = cur > prev ? 'green' : 'red'
  return chalk[color](num)
}

export function prettyNumber(num, prev) {
  return coloredNumber(humanNumber(num), num, prev)
}

export function prettyBytes(num, prev) {
  return coloredNumber(humanBytes(num), num, prev)
}

export function prettyHeader(cols) {
  let prevPadding = 1

  return cols.map((c, i) => {
    if (!c.text) {
      return c
    }

    const align = c.align || 'left'

    const padCount = c.width - c.text.length
    let padLeft = Math.floor(padCount / 2)
    let padRight = Math.ceil(padCount / 2)

    let hiddenPadLeft = ''
    let hiddenPadRight = ''

    // TODO: the hidden padding as column marker probably doesnt work perfectly
    //  in all cases, but it does work in our use cases
    if (align === 'left' && padRight > 1) {
      padRight--
      hiddenPadRight = chalk.bgBlack.black('|')
      prevPadding = 1
    } else if (align === 'right' && padLeft > 1 && !prevPadding) {
      padLeft--
      hiddenPadLeft = chalk.bgBlack.black('|')
      prevPadding = 0

      if ((padCount % 2) !== 0) {
        padLeft++
        padRight--
      }
    } else {
      prevPadding = 0
    }

    // we want headers to be centered,
    // set left and center with our padding
    c.align = 'left'

    // cliui trims whitespace, use _ and make it disappear ** wow so magic **
    c.text =
      hiddenPadLeft +
      chalk.bgWhite.white('_'.repeat(padLeft)) +
      chalk.bgWhite.black(c.text) +
      chalk.bgWhite.white('_'.repeat(padRight)) +
      hiddenPadRight
    return c
  })
}

export function prettyRow(cols, chalkOption) {
  if (!chalkOption || typeof chalk[chalkOption] === 'undefined') {
    return cols
  }

  if (Array.isArray(cols)) {
    return cols.map(c => (c.text = chalk[chalkOption](c.text)) && c)
  }

  return chalk[chalkOption](cols)
}

export function getHeader(options, stats) {
  const ui = cliui()

  const cols = []

  if (options.averages) {
    if (!heapHeaders.length) {
      heapHeaders.push(...heapHeader)

      if (stats.real_heap_size === undefined) {
        /* istanbul ignore next line */
        heapHeaders.pop()
      }

      options.heapAverages.forEach((heapCount) => {
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
        /* istanbul ignore next line */
        continue
      }
      cols.push(memwatchHeader[key] || { text: key })
    }
  }

  // print headers in gray (not prety, too intrusive for here)
  ui.div(...prettyRow(cols, 'gray'))

  return ui.toString()
}

export function getValue(col, key, val) {
  if (col.pretty && col.bytes) {
    return prettyBytes(val, previousStats[key])
  }

  if (col.pretty) {
    return prettyNumber(val, previousStats[key])
  }

  if (col.bytes) {
    return humanBytes(val)
  }

  if (col.number) {
    return humanNumber(val)
  }

  if (col.seconds) {
    // the stats times are in nano seconds, convert to seconds
    return humanSeconds(val / 1e9)
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
      /* istanbul ignore next line */
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
  cols.push(prettyBytes(stats.used_heap_size, previousStats.used_heap_size))

  if (stats.real_heap_size !== undefined) {
    cols.push(prettyBytes(stats.real_heap_size, previousStats.real_heap_size))
  }

  stats.mean = {}
  options.heapAverages.forEach((heapCount) => {
    if (previousHeapSizes.length >= heapCount) {
      const heapSizes = previousHeapSizes.slice(-1 * heapCount)

      stats.mean[heapCount] = mean(heapSizes)
      cols.push(prettyBytes(stats.mean[heapCount], previousStats.mean[heapCount]))
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

export function getDiff(diff) {
  const ui = cliui()

  // always print headers in gray
  ui.div('')
  ui.div(prettyRow('HEAP DIFF', 'gray'))
  ui.div(...prettyHeader(JSON.parse(diffHeader)))

  for (const type in diff) {
    const headerRow = JSON.parse(diffHeader)

    headerRow[0].text = type

    if (type === 'change') {
      headerRow[1].text = coloredNumber(humanBytes(diff[type].size_bytes), diff.after.size_bytes, diff.before.size_bytes)
      headerRow[2].text = coloredNumber(diff[type].allocated_nodes, diff.after.nodes, diff.before.nodes)
      headerRow[3].text = diff[type].freed_nodes
    } else {
      headerRow[1].text = humanBytes(diff[type].size_bytes)
      headerRow[2].text = diff[type].nodes
      headerRow[3].text = ''

      // dim these rows
      headerRow.forEach(d => (d.text = chalk.dim(d.text)))
    }

    ui.div(...headerRow)
  }

  // make copy also of the objects
  const _diffDetailsHeader = JSON.parse(diffDetailsHeader)

  // calculate max length of what column
  const whatMaxLength = diff.change.details.reduce((acc, d) => Math.max(acc, d.what.length), 0) + 1
  _diffDetailsHeader[0].width = whatMaxLength

  ui.div('')
  ui.div(prettyRow('DETAILS', 'gray'))
  ui.div(...prettyHeader(_diffDetailsHeader))

  const details = diff.change.details
  details.sort((a, b) => {
    if (b.size_bytes !== a.size_bytes) {
      return b.size_bytes - a.size_bytes
    }

    // what should be unique
    return a.what > b.what ? 1 : -1
  })

  for (const detail of details) {
    const detailRow = JSON.parse(diffDetailsHeader)

    detailRow[0].text = detail.what
    detailRow[0].width = whatMaxLength
    detailRow[1].text = humanBytes(detail.size_bytes)
    detailRow[2].text = detail['+']
    detailRow[3].text = detail['-']

    // dim the row if it wasnt growing
    let prettyOption = ''
    if (detail.size_bytes <= 0) {
      prettyOption = 'dim'
    }

    ui.div(...prettyRow(detailRow, prettyOption))
  }

  ui.div('')

  return ui.toString()
}
