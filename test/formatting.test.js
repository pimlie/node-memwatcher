import * as formatting from '../src/formatting'
import gcStats from './utils/gc-stats'
import heapDiff from './utils/heap-diff'

const averageOptions = { averages: true, heapAverages: [2, 3] }

describe('formatting', () => {
  afterEach(() => jest.resetModules())

  test('human bytes', () => {
    const times = [
      [18, '18.00 B'],
      [1800, '1.80 kB'],
      [18000000, '18.00 MB'],
      [1800000000, '1.80 GB']
    ]

    for (const time of times) {
      expect(formatting.humanBytes(time[0])).toBe(time[1])
    }
  })

  test('human seconds', () => {
    const times = [
      [3600, '3.6 ks'], // haha, which human uses kiloseconds?
      [1.1, '1.1 s'],
      [0.011, '11.0 ms'],
      [0.00011, '110.0 us'],
      [0.0000000011, '1.1 ns']
    ]

    for (const time of times) {
      expect(formatting.humanSeconds(time[0])).toBe(time[1])
    }
  })

  test('pretty columns', () => {
    formatting.getStatLine({ key: 2 })
    expect(formatting.getValue({ pretty: true }, 'key', 3)).toMatchSnapshot()
    expect(formatting.getValue({ pretty: true }, 'key', 1)).toMatchSnapshot()
  })

  test('number columns', () => {
    expect(formatting.getValue({ number: true }, 'key', 1)).toMatchSnapshot()
  })

  test('gc stats - getHeader', () => {
    expect(formatting.getHeader({}, gcStats[0])).toMatchSnapshot()
  })

  test('gc stats - getStats', () => {
    expect(formatting.getStats({}, gcStats[0])).toMatchSnapshot()
    expect(formatting.getStats({}, gcStats[1])).toMatchSnapshot()
    expect(formatting.getStats({}, gcStats[2])).toMatchSnapshot()
  })

  test('averages - getHeader', () => {
    expect(formatting.getHeader(averageOptions, gcStats[0])).toMatchSnapshot()
  })

  test('averages - getHeapAverages', () => {
    expect(formatting.getHeapAverages(averageOptions, gcStats[0])).toMatchSnapshot()
    expect(formatting.getHeapAverages(averageOptions, gcStats[1])).toMatchSnapshot()
    expect(formatting.getHeapAverages(averageOptions, gcStats[2])).toMatchSnapshot()
  })

  test('getStatLine', () => {
    expect(formatting.getStatLine(gcStats[0])).toMatchSnapshot()
    expect(formatting.getStatLine(gcStats[1])).toMatchSnapshot()
    expect(formatting.getStatLine(gcStats[2])).toMatchSnapshot()
  })

  test('getDiff', () => {
    expect(formatting.getDiff(heapDiff)).toMatchSnapshot()
  })
})
