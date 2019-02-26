import turtle from 'turtle-race'
import { getStatLine } from './formatting'

let graph

export function metricColor(perc) {
  perc = parseFloat(perc)

  if (perc > 0.8) {
    return 'red,bold'
  } else if (perc > 0.6) {
    return 'yellow,bold'
  } else {
    return ''
  }
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
      },
      requests: {
        min: 0,
        aggregator: 'avg',
        color: 'magenta,bold'
      }
    }
  }

  if (options && typeof options.setupGraph === 'function') {
    options.setupGraph(graphSetup)
  }

  const graph = turtle(graphSetup)

  const groupName = 'nuxt-memwatch'

  return {
    graph,
    heap: graph.metric(groupName, 'heapSize'),
    trend: graph.metric(groupName, 'usageTrend'),
    max: graph.metric(groupName, 'maxSize'),
    requests: graph.metric(groupName, 'requests')
  }
}

export function addMetrics(options, stats, numRequests) {
  if (!graph) {
    graph = createGraph(options, stats)
  }

  graph.heap.push(stats.used_heap_size).color(metricColor(stats.used_heap_size / stats.heap_size_limit))
  graph.trend.push(stats.usage_trend)
  graph.max.push(stats.max_heap_size).color(metricColor(stats.max_heap_size / stats.heap_size_limit))
  graph.requests.push(numRequests)

  if (options && typeof options.graphMetric === 'function') {
    options.graphMetric(graph.graph, stats, numRequests)
  }
}

export function setGraphMessage(stats) {
  if (!graph) {
    return
  }

  graph.graph.message(`gc(#${process.pid}): ${getStatLine(stats)}`)
}
