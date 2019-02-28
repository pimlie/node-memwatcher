import * as graph from '../lib/graph'
import * as formatting from '../lib/formatting'
import { setOptions } from '../lib/utils'

jest.mock('turtle-race', () => {
  return function turtle() {
    return {
      message: jest.fn(),
      metric: jest.fn(() => {
        const color = jest.fn()
        return {
          color,
          push: jest.fn(() => ({
            color
          }))
        }
      })
    }
  }
})

describe('graph', () => {
  test('metricColors', () => {
    expect(graph.metricColor(1)).toBe('red,bold')
    expect(graph.metricColor(0.9)).toBe('red,bold')
    expect(graph.metricColor(0.8000000001)).toBe('red,bold')
    expect(graph.metricColor(0.8)).toBe('yellow,bold')
    expect(graph.metricColor(0.7)).toBe('yellow,bold')
    expect(graph.metricColor(0.61)).toBe('yellow,bold')
    expect(graph.metricColor(0.6)).toBe('')
  })
  
  test('setupGraph', () => {
    const graphSetup = jest.fn()
    const groupName = 'test group'
    const stats = { key: 1 }
    const _graph = graph.createGraph(setOptions({ graphSetup, groupName }), stats)

    expect(_graph.turtle).toBeTruthy()
    expect(_graph.heap).toBeTruthy()

    // user defined setup called
    expect(graphSetup).toHaveBeenCalledTimes(1)
    expect(graphSetup).toHaveBeenCalledWith(expect.any(Object), stats)

    // default metrics
    expect(_graph.turtle.metric).toHaveBeenCalledWith(groupName, 'heapSize')
    expect(_graph.turtle.metric).toHaveBeenCalledWith(groupName, 'usageTrend')
    expect(_graph.turtle.metric).toHaveBeenCalledWith(groupName, 'maxSize')
  })
  
  test('addMetrics', () => {
    const graphAddMetric = jest.fn()
    const stats = {
      used_heap_size: 7,
      max_heap_size: 10,
      heap_size_limit: 10,
      usage_trend: 0.6
    }

    const _graph = graph.addMetrics(setOptions({ graphAddMetric }), stats)

    expect(graphAddMetric).toHaveBeenCalled()

    expect(_graph.max.push).toHaveBeenCalledWith(10)
    expect(_graph.max.color).toHaveBeenCalledWith('red,bold')
    expect(_graph.heap.push).toHaveBeenCalledWith(7)
    expect(_graph.heap.color).toHaveBeenCalledWith('yellow,bold')
    expect(_graph.trend.push).toHaveBeenCalledWith(0.6)
  })

  test('setGraphMessage', () => {
    const message = 'test message'
    jest.spyOn(formatting, 'getStatLine').mockReturnValue(message)

    const _graph = graph.createGraph({}, {})

    graph.setGraphMessage()

    expect(_graph.turtle.message).toHaveBeenCalledWith(expect.stringMatching(message))

    // the message also includes the process id
    expect(_graph.turtle.message).toHaveBeenCalledWith(expect.stringMatching(`#${process.pid}`))
  })
})
