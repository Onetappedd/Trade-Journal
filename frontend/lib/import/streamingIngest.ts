// Streaming/Chunked Trade Import Utility
import type { NormalizedTrade } from "./types"

export async function streamImport(
  trades: NormalizedTrade[],
  chunkSize: number,
  postChunk: (chunk: NormalizedTrade[]) => Promise<any>,
  onProgress?: (done: number, total: number) => void
) {
  let done = 0
  for (let i = 0; i < trades.length; i += chunkSize) {
    const chunk = trades.slice(i, i + chunkSize)
    await postChunk(chunk)
    done += chunk.length
    onProgress && onProgress(done, trades.length)
  }
}
