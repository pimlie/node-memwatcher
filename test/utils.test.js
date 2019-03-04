import * as utils from '../src/utils'

const noop = () => {}

describe('utils', () => {
  afterEach(() => jest.restoreAllMocks())

  test('setOptions', () => {
    jest.spyOn(utils.logger, 'warn').mockImplementation(noop)

    const myOptions = {
      graph: true,
      heapDiffOnInterrupt: true,
      autoHeapDiff: true,
      useMovingAverage: 5,
      heapAverages: 10
    }

    let options = utils.setOptions({ ...myOptions })
    
    expect(options.graph).toBe(true)
    expect(options.verbose).toBe(true)
    expect(options.autoHeapDiff).toBe(false)
    expect(options.useMovingAverage).toBe(0)
    expect(utils.logger.warn).toHaveBeenCalledTimes(2)

    myOptions.heapDiffOnInterrupt = false
    myOptions.graph = true
    myOptions.useMovingAverage = 0
    options = utils.setOptions({ ...myOptions })

    expect(options.graph).toBe(true)
    expect(options.autoHeapDiff).toBe(false)
    expect(utils.logger.warn).toHaveBeenCalledTimes(3)
  })
})
