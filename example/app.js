#!/usr/bin/env node

require = require('esm')(module, { // eslint-disable-line no-global-assign
  cache: false,
  cjs: {
    cache: true,
    namedExports: true
  }
})

function randomString(length) {
  let i = 0
  let str = ''

  while (++i < length) {
    str += String.fromCharCode(33 + Math.floor(93 * Math.random()))
  }

  return str
}

async function main() {
  const { start, getMemwatch } = require('..')

  await start({
    graph: true,
    useMovingAverage: 5,
    leakGrowthCount: 3,
    autoHeapDiff: true,
    gcMetrics: true
  })

  const memwatch = await getMemwatch()

  let log = { count: 1 }
  setInterval(() => {
    /* TODO:
     * setting a too long string will result in a segfault
     * in @airbnb/node-memwatch when creating a heap diff
     *
     * also, this is a random string because apparently v8 is smart enough
     * to not create multiple copies of the same string variable
     */
    log[++log.count] = randomString(10000)

    if (!(log.count % 10)) {
      memwatch.gc()
    }
  }, 100)

  setInterval(() => {
    log = { count: 1 }
    memwatch.gc()
  }, 20000)
}

main()
