import turtleRace from 'turtle-race'
import { getStatLine } from './formatting'

let graph

export function metricColor(perc) {
  perc = parseFloat(perc)

  if (perc > 0.8) {
    return 'red,bold'
  }

  if (perc > 0.6) {
    return 'yellow,bold'
  }

  return ''
}

export function createGraph(options, stats) {
  const graphSetup = {
    seconds: false,
    noAutoStart: false,
    keep: true,
    metrics: {
      heapSize: {
        min: 0,
        aggregator: 'last',
        color: 'green,bold'
      },
      usageTrend: {
        min: 0,
        color: 'yellow,bold'
      },
      maxSize: {
        min: 0,
        aggregator: 'max',
        color: 'green,bold'
      }
    }
  }

  if (options && Array.isArray(options.graphSetup)) {
    options.graphSetup.forEach(fn => fn(graphSetup, stats))
  }

  const turtle = turtleRace(graphSetup)

  graph = {
    turtle,
    heap: turtle.metric(options.groupName, 'heapSize'),
    trend: turtle.metric(options.groupName, 'usageTrend'),
    max: turtle.metric(options.groupName, 'maxSize')
  }

  return graph
}

export function addMetrics(options, stats) {
  /* istanbul ignore next */
  if (!graph) {
    createGraph(options, stats)
  }

  graph.max.push(stats.max_heap_size).color(metricColor(stats.max_heap_size / stats.heap_size_limit))
  graph.heap.push(stats.used_heap_size).color(metricColor(stats.used_heap_size / stats.heap_size_limit))
  graph.trend.push(stats.usage_trend)

  if (options && Array.isArray(options.graphAddMetric)) {
    options.graphAddMetric.forEach(fn => fn(graph.turtle, stats))
  }

  return graph
}

export function setGraphMessage(stats) {
  /* istanbul ignore next */
  if (!graph) {
    return
  }

  graph.turtle.message(`gc(#${process.pid}): ${getStatLine(stats)}`)
}
