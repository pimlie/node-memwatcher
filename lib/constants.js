export const defaultOptions = {
  useMovingAverage: 0,
  leakGrowthCount: 5,
  verbose: true,
  headerEveryLines: 25,
  autoHeapDiff: false,
  graph: false,
  gcMetrics: false,
  averages: false,
  heapAverages: [10, 50, 100],
  gcAfterEvery: 0,
  heapDiffOnInterrupt: false,
  gcOnInterrupt: true,
  appName: 'memwatcher',
  groupName: 'memwatch',
  graphSetup: [],
  graphAddMetric: []
}

// order here defines printing order
export const memwatchHeader = {
  gcMarkSweepCompactCount: {
    text: 'full',
    width: 6
  },
  gcIncrementalMarkingCount: {
    text: 'incr',
    width: 6
  },
  gcScavengeCount: {
    text: 'scavg',
    width: 6
  },
  gcProcessWeakCallbacksCount: {
    text: 'weak',
    width: 6
  },
  gc_time: {
    text: 'time',
    seconds: true,
    width: 8,
    align: 'right'
  },
  usage_trend: {
    text: 'trend',
    width: 8,
    align: 'right'
  },
  used_heap_size: {
    text: 'current',
    width: 12,
    pretty: true,
    bytes: true,
    align: 'right'
  },
  real_heap_size: {
    text: 'real',
    width: 12,
    pretty: true,
    bytes: true,
    align: 'right'
  },
  min_heap_size: {
    text: 'min',
    width: 12,
    bytes: true,
    align: 'right'
  },
  max_heap_size: {
    text: 'max',
    width: 12,
    pretty: true,
    bytes: true,
    align: 'right'
  }
}

export const heapHeader = [{
  text: '# gc',
  width: 6
}, {
  text: 'current',
  width: 12,
  pretty: true,
  bytes: true,
  align: 'right'
}, {
  text: 'real',
  width: 12,
  pretty: true,
  bytes: true,
  align: 'right'
}]

// We use JSON.stringify because we alwaysneed to make
// copies of the objects anyway because otherwise
// all header parts reference the same object
// (and they'll all have the same text value)
export const heapHeaderPart = JSON.stringify([{
  text: 'mean',
  width: 12,
  pretty: true,
  bytes: true,
  align: 'right'
}, {
  text: 'σ',
  width: 12,
  number: true,
  align: 'right'
}])

export const diffHeader = JSON.stringify([{
  text: '',
  width: 10
}, {
  text: 'size',
  width: 10,
  align: 'right'
}, {
  text: 'nodes',
  width: 10,
  align: 'right'
}, {
  text: 'freed',
  width: 10,
  align: 'right'
}])

export const diffDetailsHeader = JSON.stringify([{
  text: 'what',
  width: 10
}, {
  text: 'size',
  width: 10,
  align: 'right'
}, {
  text: '+',
  width: 10,
  align: 'right'
}, {
  text: '-',
  width: 10,
  align: 'right'
}])
