import { getMemwatch } from './memwatch'
import { getDiff } from './formatting'
import { logger } from './utils'

let heapDiff

export async function startHeapDiff() {
  logger.info('Dumping first heap (could take a while)')

  const memwatch = await getMemwatch()

  heapDiff = new memwatch.HeapDiff()
  return heapDiff
}

export function endHeapDiff(printStats) {
  if (!heapDiff) {
    return false
  }

  logger.info('Dumping second heap and create diff (could take a while)')
  const diffStats = heapDiff.end()

  if (printStats) {
    logger.log(getDiff(diffStats))
  }

  return diffStats
}

export function clearHeapDiff() {
  if (heapDiff) {
    heapDiff = undefined
  }
}
