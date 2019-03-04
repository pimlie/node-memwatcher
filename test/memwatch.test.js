import * as memwatch from '../src/memwatch'
import * as start from '../src/start'
import * as utils from '../src/utils'

const noop = () => {}

describe('memwatch', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  test('dynamically loads memwatch', async () => {
    const m = await memwatch.getMemwatch()

    expect(m).toBeTruthy()
    expect(m._faked).toBeUndefined()
    expect(m.HeapDiff).toEqual(expect.any(Function))
    expect(m.gc).toEqual(expect.any(Function))
  })

  /* Cant seem to mock dynamic imports with jest
   * and we need @babel/plugin-syntax-dynamic-import to mock the import
   * but dynamic-import-node to retrieve the actual module
   * skip this for now and just test fakeMemwatch
   */
  test.skip('returns fake memwatch when peer dep missing', async () => {
    jest.doMock('@airbnb/node-memwatch', () => Promise.reject(new Error()))

    const m = await memwatch.loadMemwatch()
    expect(m).toBeTruthy()
    expect(m._faked).toBeDefined()

    jest.unmock('@airbnb/node-memwatch')
  })

  test('fake memwatch has similar api', () => {
    const spy = jest.spyOn(utils.logger, 'warn')

    const fakeMemwatch = memwatch.fakeMemwatch()

    expect(fakeMemwatch.HeapDiff).toEqual(expect.any(Function))
    expect(fakeMemwatch.gc).toEqual(expect.any(Function))
    expect(fakeMemwatch.on).toEqual(expect.any(Function))
    expect(spy).not.toHaveBeenCalled()
  })

  test('fake memwatch warns on calling gc', () => {
    const spy = jest.spyOn(utils.logger, 'warn').mockImplementation(noop)

    const fakeMemwatch = memwatch.fakeMemwatch()
    fakeMemwatch.gc()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('fake memwatch warns on starting heap diff', () => {
    const spy = jest.spyOn(utils.logger, 'warn').mockImplementation(noop)

    const fakeMemwatch = memwatch.fakeMemwatch()

    const hd = new fakeMemwatch.HeapDiff()
    expect(hd.end).toEqual(expect.any(Function))
    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('fake memwatch starts interval for sending fake events', () => {
    const spy = jest.spyOn(start, 'startStatsInterval').mockReturnValue(1)

    const fakeMemwatch = memwatch.fakeMemwatch()

    fakeMemwatch.on('anything', noop)
    expect(spy).not.toHaveBeenCalled()

    fakeMemwatch.on('stats', noop)
    expect(spy).toHaveBeenCalledTimes(1)

    // listener can be removed as well
    expect(fakeMemwatch._interval).toBeDefined()
    fakeMemwatch.off('stats')
    expect(fakeMemwatch._interval).toBeUndefined()
  })
})
