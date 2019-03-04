import v8 from 'v8'
import start from '../src/start'
import * as utils from '../src/utils'
import * as memwatch from '../src/memwatch'
import * as heapdiff from '../src/heapdiff'
import * as formatting from '../src/formatting'

const noop = () => {}

describe('start', () => {
  afterEach(() => jest.restoreAllMocks())

  test('getHeapStats', () => {
    const spy = jest.spyOn(v8, 'getHeapStatistics')

    // loop to warmup ancientHeapSizes
    for (let i = 0; i < 10; i++) {
      spy.mockReturnValueOnce({
        used_heap_size: 10,
        total_heap_size: 10
      })
      utils.getHeapStats()
    }

    expect(spy).toHaveBeenCalledTimes(10)

    spy.mockReturnValueOnce({
      used_heap_size: 200,
      total_heap_size: 400
    })

    const stats = utils.getHeapStats()

    expect(stats.used_heap_size).toBe(200)
    expect(stats.total_heap_size).toBe(400)
    expect(stats.usage_trend).toBe(0.1)
    expect(stats.min_heap_size).toBe(10)
    expect(stats.max_heap_size).toBe(400)
    spy.mockRestore()
  })

  test('startStatsInterval', () => {
    jest.useFakeTimers()
    const spy = jest.fn()

    utils.startStatsInterval(spy)

    jest.advanceTimersByTime(2001)

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0][0].gcMarkSweepCompactCount).toBe(1)
    expect(spy.mock.calls[1][0].gcMarkSweepCompactCount).toBe(2)
  })

  test('can create heap diff and print stats', async () => {
    const end = jest.fn().mockReturnValue(1)

    jest.spyOn(utils.logger, 'log').mockImplementation(noop)
    jest.spyOn(utils.logger, 'info').mockImplementation(noop)
    jest.spyOn(formatting, 'getDiff').mockReturnValue('diff')
    jest.spyOn(memwatch, 'getMemwatch').mockImplementation(() => {
      return {
        HeapDiff: function () {
          return { end }
        }
      }
    })

    await heapdiff.startHeapDiff()
    const diff = heapdiff.endHeapDiff(true)

    expect(utils.logger.log).toHaveBeenCalledTimes(1)
    expect(utils.logger.info).toHaveBeenCalledTimes(2)
    expect(end).toHaveBeenCalledTimes(1)
    expect(formatting.getDiff).toHaveBeenCalled()
    expect(diff).toBe(1)
  })

  test('heap diff can be interrupted', async () => {
    const end = jest.fn().mockReturnValue(1)

    jest.spyOn(utils.logger, 'info').mockImplementation(noop)

    jest.spyOn(memwatch, 'getMemwatch').mockImplementation(() => {
      return {
        HeapDiff: function () {
          return { end }
        }
      }
    })

    await heapdiff.startHeapDiff()
    heapdiff.clearHeapDiff()
    const diff = heapdiff.endHeapDiff()

    expect(utils.logger.info).toHaveBeenCalledTimes(1)
    expect(end).not.toHaveBeenCalled()
    expect(diff).toBe(false)
  })

  test('start', async () => {
    jest.spyOn(utils.logger, 'success').mockImplementation(noop)
    jest.spyOn(utils.logger, 'info').mockImplementation(noop)
    jest.spyOn(utils.logger, 'debug').mockImplementation(noop)
    jest.spyOn(utils, 'startStatsInterval').mockImplementation(noop)

    const fakeMemwatch = memwatch.fakeMemwatch()
    let eventCallback
    jest.spyOn(fakeMemwatch, 'on').mockImplementation((eventName, _callback) => {
      eventCallback = _callback
    })
    jest.spyOn(memwatch, 'getMemwatch').mockReturnValue(fakeMemwatch)

    await start()

    expect(utils.logger.success).toHaveBeenCalledTimes(1)
    expect(utils.logger.info).toHaveBeenCalledTimes(1)

    eventCallback({
      used_heap_size: 10,
      total_heap_size: 10
    })

    expect(utils.logger.debug).toHaveBeenCalledTimes(2)

    // header is printed
    expect(utils.logger.debug).toHaveBeenCalledWith(expect.stringMatching('current'))
    // stats are printed
    expect(utils.logger.debug).toHaveBeenCalledWith(expect.stringMatching('10.00 B'))

    jest.resetAllMocks()

    eventCallback({
      used_heap_size: 10,
      total_heap_size: 10
    })

    expect(utils.logger.debug).toHaveBeenCalledTimes(1)
    // header is not printed
    expect(utils.logger.debug).not.toHaveBeenCalledWith(expect.stringMatching('current'))
    // stats are printed
    expect(utils.logger.debug).toHaveBeenCalledWith(expect.stringMatching('10.00 B'))
  })
})
