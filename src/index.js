import compress from "./image-compression";
import { getImageInfo, getFileSize } from "./utils";

/**
 * Compress an image file.
 *
 * @param {string} file
 * @param {Object} options
 * @param {number} [options.maxSizeMB=Number.POSITIVE_INFINITY]
 * @param {number} [options.maxWidthOrHeight=undefined]
 * @param {number} [options.maxIteration=10]
 * @param {number} [options.exifOrientation] - default to be the exif orientation from the image file
 * @param {Function} [options.onProgress] - a function takes one progress argument (progress from 0 to 100)
 * @param {string} [options.fileType] - default to be the original mime type from the image file
 * @param {number} [options.initialQuality=1.0]
 * @param {boolean} [options.alwaysKeepResolution=false]
 * @param {boolean} [options.preserveExif] - preserve Exif metadata
 * @param {string} [options.libURL] - URL to this library
 * @returns {Promise<File | Blob>}
 */
async function imageCompression(file, options) {
  const opts = { ...options };

  let compressedFile;
  let progress = 0;
  const { onProgress } = opts;

  opts.maxSizeMB = opts.maxSizeMB || Number.POSITIVE_INFINITY;
  opts.onProgress = (aProgress) => {
    progress = aProgress;
    if (typeof onProgress === "function") {
      onProgress(progress);
    }
  };

  const img = await getImageInfo(file);
  const size = await getFileSize(file);

  compressedFile = await compress(file, { ...opts, img: { ...img, size } });

  return compressedFile;
}

export default imageCompression;
