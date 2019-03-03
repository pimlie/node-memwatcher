# Quickly watch real-time memory stats of your node app
<a href="https://travis-ci.org/pimlie/node-memwatcher"><img src="https://api.travis-ci.org/pimlie/node-memwatcher.svg" alt="Build Status"></a>
[![npm](https://img.shields.io/npm/dt/node-memwatcher.svg?style=flat-square)](https://www.npmjs.com/package/node-memwatcher)
[![npm (scoped with tag)](https://img.shields.io/npm/v/node-memwatcher/latest.svg?style=flat-square)](https://www.npmjs.com/package/node-memwatcher)

## Introduction

This library lets you quickly log and view graphs of the memory stats of your node application. Also it can e.g. create automatic heap diffs when a possible memory leak is detected. It is in essential a wrapper for node-memwatch, but it also provides a fake node-memwatch api which uses v8.getHeapStatistics and global.gc instead. This is because node-memwatch uses gyp bindings which might not be what you want in some cases, therefore node-memwatch is a peer dependency.

<p align="center"><img src="./assets/demo.gif" alt="node-memwatcher demo"/></p>

Log gc stats with automatich heap dumps on possible memory leaks
<p align="center"><img src="./assets/demo2.gif" alt="node-memwatcher demo2"/></p>

## Setup

##### Install
```
npm install --save node-memwatcher
// or
yarn add node-memwatcher
```

##### Install the peer dependency (recommended)
```
npm install --save @airbnb/node-memwatch
// or
yarn add @airbnb/node-memwatch
```

##### Import node-memwatcher and start listening
```js
import { start } from 'node-memwatcher'
await start()
```
See the [example](./example/app.js) for a demo application. To run the example: clone this repo and run `yarn install && yarn demo`

## FAQ

Please read the [FAQ](https://github.com/pimlie/node-memwatcher/wiki/FAQ)

## Options

#### `graph` _boolean_ (false)

If true then we print time-based graphs for the heap statistics (see demo), if false then we log the stats as normal text (and `verbose: true`, see below)

> :information_source: Make sure your project doesnt log any other information to the console because that will (partially) overwrite the graph

#### `verbose` _boolean_ (true)

If true then we listen for the stats event from node-memwatch and display real time gc statistics

#### `gcMetrics` _boolean_ (false)

If true then the graph is updated when a stats event is received from node-memwatch. The graph is updated every 1 second, to match that interval we add the metrics by default also every second. As gc stats might not be available, we use [`v8.getHeapStatistics`](https://nodejs.org/api/v8.html#v8_v8_getheapstatistics) to retrieve the stats. This gives us a nice resolution, but this method returns actual heap statistics (as in, there might be memory which node could release but just hasnt yet).
When you are hunting down a memory leak, the heap usage just after the gc has run gives you a better understanding of your app's memory usage (with a lower resolution as trade off)

#### `averages` _boolean_ (false)

If true then we calculate and log long standing averages (think eg of uptime with 1min, 5min averages but with number of stats). This option is ignored when `graph: true` 

#### `heapAverages` _[number]_ ([10, 50, 100])

If `averages: true, graph: false` then we will print averages for each of these number of stats events.

#### `useMovingAverage` _number_ (0)

If set to a number larger then 0 we will calculate the `used_heap_size` by taking the moving average of this last number of stats events

#### `leakGrowthCount` _number_ (5)

We define a memory leak as when this number of stats events have consecutively been growing the heap size

#### `autoHeapDiff` _boolean_ (false)

If true then we will automatically create a heap diff when a memory leak is detected. The first heap dump is created at `leakGrowthCount - 1`.

> :fire: Taking heap dumps can be very expensive, you probably shouldnt enable this in production

#### `headerEveryLines` _number_ (25)

How often we print a header with column names when `graph: false, verbose: true`

#### `gcOnInterrupt` _boolean_ (true)

If true then the gc is run when a user signal is sent to the running process

> :information_source: the interrupt signal is `SIGBREAK` on Windows and `SIGUSR2` on others

#### `heapDiffOnInterrupt` _boolean_ (false)

If true then you can create a heap diff by sending an user signal to the running process. You will always need to sent two signals for both the start heap dump as the end heap dump. The heap diff will then be calculated and logged

> :information_source: the interrupt signal is `SIGBREAK` on Windows and `SIGUSR2` on others

#### `graphSetup` _[function]_ (undefined)

A function or array of functions which receives the graph setup as the first argument. Use this to setup your own metrics

> See the readme of [turtle-race](https://github.com/lbovet/turtle-race) and [zibar](https://github.com/lbovet/zibar) for more information

#### `graphAddMetric` _[function]_ (undefined)

A function or array of functions which are called every time new metrics are added to the graph. It receives the turtle graph as first argument and the stats as second argument. Use this to add your own metrics

## Alternatives

- Run node with `--trace-gc` or `--trace-gc-nvp` for more detailed information
