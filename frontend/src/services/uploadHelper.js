/**
 * Safe upload batch configuration and size-aware file batching logic.
 *
 * Vercel Serverless Functions enforce a 4.5 MB maximum incoming request body limit.
 * 3.8 MB (3,984,588 bytes) provides a conservative ~700 KB buffer for multipart
 * boundary markers, Content-Disposition headers, and form-data framing.
 */
export const SAFE_UPLOAD_BATCH_SIZE_BYTES = 3.8 * 1024 * 1024

/**
 * Formats bytes into a human-readable MB string (e.g., "3.8 MB").
 *
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytesToMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Splits an array of File/Blob objects into size-aware batches where the total
 * file size of each batch does not exceed maxBatchSize.
 *
 * Files individually exceeding maxBatchSize are placed into the oversized list
 * to prevent oversized single-file requests from triggering HTTP 413.
 *
 * @param {Array<{ size: number, name?: string }>} files - List of File objects
 * @param {number} [maxBatchSize=SAFE_UPLOAD_BATCH_SIZE_BYTES] - Maximum batch size in bytes
 * @returns {{ batches: Array<Array<File>>, oversized: Array<File> }}
 */
export function createUploadBatches(files, maxBatchSize = SAFE_UPLOAD_BATCH_SIZE_BYTES) {
  if (!Array.isArray(files) || files.length === 0) {
    return { batches: [], oversized: [] }
  }

  const batches = []
  const oversized = []
  let currentBatch = []
  let currentBatchSize = 0

  for (const file of files) {
    const fileSize = typeof file.size === 'number' ? file.size : 0

    // Handle files individually larger than the safe batch ceiling
    if (fileSize > maxBatchSize) {
      oversized.push(file)
      continue
    }

    // If adding this file would push current batch over the limit, start a new batch
    if (currentBatch.length > 0 && currentBatchSize + fileSize > maxBatchSize) {
      batches.push(currentBatch)
      currentBatch = [file]
      currentBatchSize = fileSize
    } else {
      currentBatch.push(file)
      currentBatchSize += fileSize
    }
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch)
  }

  return { batches, oversized }
}
