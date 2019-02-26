export const defaultOptions = {
  useMovingAverage: 0,
  leakGrowthCount: 5,
  nuxtHook: 'listen',
  verbose: true,
  headerEveryLines: 25,
  autoHeapDiff: false,
  graph: true,
  graphOnGC: true,
  averages: false,
  heapAverages: [10, 50, 100],
  gcAfterEvery: 0,
  heapDiffOnInterrupt: false,
  gcOnInterrupt: true
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
    width: 6
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
    number: true,
    align: 'right'
  },
  real_heap_size: {
    text: 'real',
    width: 12,
    pretty: true,
    number: true,
    align: 'right'
  },
  min_heap_size: {
    text: 'min',
    width: 12,
    number: true,
    align: 'right'
  },
  max_heap_size: {
    text: 'max',
    width: 12,
    pretty: true,
    number: true,
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
  number: true,
  align: 'right'
}, {
  text: 'real',
  width: 12,
  pretty: true,
  number: true,
  align: 'right'
}]

export const heapHeaderPart = {
  mean: {
    text: 'mean',
    width: 12,
    pretty: true,
    number: true,
    align: 'right'
  },
  stddev: {
    text: 'σ',
    width: 12,
    number: true,
    align: 'right'
  }
}
