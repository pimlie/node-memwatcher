import * as interrupt from '../src/interrupt'
import * as memwatch from '../src/memwatch'
import * as heapdiff from '../src/heapdiff'

jest.mock('../src/heapdiff')

describe('interrupt', () => {
  let procSpy
  let signal

  beforeAll(() => {
    procSpy = jest.spyOn(process, 'once')
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.resetModules()
    process.removeAllListeners(signal)
  })

  afterAll(() => {
    procSpy.mockRestore()
  })

  test('start heap is default listener', () => {
    procSpy.mockImplementationOnce((_signal, listener) => {
      signal = _signal
      listener()
    })

    interrupt.listenInterrupt()

    expect(procSpy).toHaveBeenCalledTimes(2)
    expect(heapdiff.startHeapDiff).toHaveBeenCalledTimes(1)
    expect(heapdiff.endHeapDiff).not.toHaveBeenCalled()
  })

  test('default signal is SIGUSR2', () => {
    expect(signal).toBe('SIGUSR2')
  })

  test('chains start/end listeners ', () => {
    procSpy.mockImplementationOnce((s, listener) => {
      // test chain by letting call the interrupt itself recursively once
      procSpy.mockImplementationOnce((s, listener) => {
        listener()
      })

      listener()
    })

    interrupt.listenInterrupt()

    expect(procSpy).toHaveBeenCalledTimes(3)
    expect(heapdiff.startHeapDiff).toHaveBeenCalledTimes(1)
    expect(heapdiff.endHeapDiff).toHaveBeenCalledTimes(1)
  })

  test('calls gc on interrupt ', async () => {
    const gc = jest.fn()
    const memSpy = jest.spyOn(memwatch, 'getMemwatch').mockImplementation(() => ({ gc }))

    await new Promise((resolve) => {
      procSpy.mockImplementationOnce(async (s, listener) => {
        await listener()
        resolve()
      })
      interrupt.listenInterrupt(interrupt.doGC)
    })

    expect(memSpy).toHaveBeenCalledTimes(1)
    expect(gc).toHaveBeenCalled()
  })
})
