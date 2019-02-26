# Quickly watch real-time memory usage of your nuxt app
<!-- <a href="https://travis-ci.org/pimlie/nuxt-memwatch"><img src="https://api.travis-ci.org/pimlie/nuxt-memwatch.svg" alt="Build Status"></a> -->
[![npm](https://img.shields.io/npm/dt/nuxt-memwatch.svg?style=flat-square)](https://www.npmjs.com/package/nuxt-memwatch)
[![npm (scoped with tag)](https://img.shields.io/npm/v/nuxt-memwatch/latest.svg?style=flat-square)](https://www.npmjs.com/package/nuxt-memwatch)

## Why and when do you use this module

Other tools provide maybe the same functionality, but this module is probably the quickest way to get more insights of the memory usage by your nuxt server. Also see the [node-memwatch](https://github.com/airbnb/node-memwatch) readme for more information

## Setup
> Reminder: you dont need to re-build your project when en-/disabling this module, you only need to restart the server

- Install with 
```
npm install --save nuxt-memwatch
// or
yarn add nuxt-memwatch
```

- Install the peerDependencies (recommended)
```
npm install --save @airbnb/node-memwatch
// or
yarn add @airbnb/node-memwatch
```

- Add `nuxt-memwatch` to `modules` section of `nuxt.config.js`
```js
  modules: [
    ['nuxt-memwatch', { graph: false }],
  ]
```
or 
```js
  modules: [
    'nuxt-memwatch'
  ],
  memwatch: {
    setupGraph(graphSetup) {
      graphSetup.metrics.malloc = {
        aggregator: 'avg',
        color: 'cyan'
      }
    },
    graphMetric(graph, stats) {
      graph.metric('my metrics', 'malloc').push(stats.malloced_memory)
    }
  }
```

## Module Options

#### `graph` boolean (true)

If true then we print time-based graphs for the heap statistics

#### `verbose` boolean (true)

If true then we listen for the stats event from node-memwatch and display real time gc statistics

#### `graphOnGC` boolean (false)

If true then the graph is updated when a stats event is received. The graph is updated every 1 second so by default we also add the metrics every seconds with stats from `v8.getHeapStatistics`. This gives us a nice resolution. But this returns actual heap statistics, if you are hunting down a memory leak the more accurate heap usage from the stats event might be what you want to see (with a lower resolution as trade off)

#### `averages` boolean (false)

If true then we calculate and log long standing averages (think of uptime with eg 1min, 5min averages but with number of stats). This option is ignored when `graph: true` 

#### `heapAverages` [number] ([10, 50, 100])

If `averages: true, graph: false` then we will print averages for each of these number of stats events.

#### `useMovingAverage` number (0)

If set to a number larger then 0 we will calculate the used_heap_size by taking the moving average of this last number of stats events

#### `leakGrowthCount` number (5)

We define a memory leak as when this number of stats events have consecutively been growing the heap size

#### `autoHeapDiff` boolean (false)

If true then we will automatically create a heap diff when a memory leak is detected. The first heap dump is created at leakGrowthCount - 1.

> :fire: Taking heap dumps can be very expensive, you probably shouldnt enable this in production

#### `headerEveryLines` number (25)

How often we print a header with column names when `graph: false, verbose: true`

#### `gcAfterEvery` number (0)

If set to a number larger then 0, we will force the gc to run after this number of requests. E.g. when set to 1 the gc runs after every request

> :fire: This only works when you have either installed the peerDependency or are running node with `--expose_gc`

#### `gcOnInterrupt` boolean (true)

If true then the gc is run when a user signal is sent to the running process

> :info: send `SIGUSR2` except on Windows use `SIGBREAK`

#### `heapDiffOnInterrupt` boolean (false)

If true then you can create a heap diff by sending an user signal to the running process. You will always need to sent two signals for both the start heap dump as the end heap dump. The heap diff will then be calculated and logged

> :info: send `SIGUSR2` except on Windows use `SIGBREAK`

#### `nuxtHook` string (listen)

Normally we are interested in memory usage when nuxt is serving requests, so we start listening for stats events on the listen hook. Its probably better to not change this

#### `setupGraph` function (undefined)

If defined it receives the graph setup as the first argument. Use this to setup your own metrics

#### `graphMetric` function (undefined)

If defined it receives the graph as first argument, the stats as second argument and the number of requests as third argument. Use this to add your own metrics
