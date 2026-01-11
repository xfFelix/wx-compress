import {
  canvasToFile,
  cleanupCanvasMemory,
  drawImageInCanvas,
  followExifOrientation,
  getNewCanvasAndCtx,
  handleMaxWidthOrHeight,
  writeFile,
} from "./utils";
import { ORIENTATION_MAP } from "./config";

/**
 * Compress an image file.
 *
 * @param {string} file
 * @param {Object} options
 * @param {Object} img 图片信息
 * @param {number} [options.maxSizeMB=Number.POSITIVE_INFINITY]
 * @param {number} [options.maxWidthOrHeight=undefined]
 * @param {number} [options.maxIteration=10]
 * @param {Function} [options.onProgress] - a function takes one progress argument (progress from 0 to 100)
 * @param {string} [options.fileType] - default to be the original mime type from the image file
 * @param {number} [options.initialQuality=1.0]
 * @param {boolean} [options.alwaysKeepResolution=false]
 * @param {boolean} [options.returnFilePath=false]
 * @param {number} previousProgress - for internal try catch rerunning start from previous progress
 * @returns {Promise<File | Blob>}
 */
export default async function compress(file, options, previousProgress = 0) {
  let progress = previousProgress;

  function incProgress(inc = 5) {
    progress += inc;
    options.onProgress(Math.min(progress, 100));
  }

  function setProgress(p) {
    progress = Math.min(Math.max(p, progress), 100);
    options.onProgress(progress);
  }

  let remainingTrials = options.maxIteration || 10;

  const maxSizeByte = options.maxSizeMB * 1024 * 1024;

  incProgress();

  // drawFileInCanvas
  const origCanvas = await drawImageInCanvas(file, options);

  incProgress();

  // handleMaxWidthOrHeight
  const maxWidthOrHeightFixedCanvas = await handleMaxWidthOrHeight(
    origCanvas,
    options,
  );

  incProgress();

  // exifOrientation
  const exifOrientation = ORIENTATION_MAP[options.img.orientation];
  incProgress();
  const orientationFixedCanvas = await followExifOrientation(
    maxWidthOrHeightFixedCanvas,
    exifOrientation,
  );
  incProgress();

  let quality = options.initialQuality || 1.0;

  const outputFileType = options.fileType || options.img.type;

  const tempFile = canvasToFile(
    orientationFixedCanvas,
    outputFileType,
    quality,
  );
  incProgress();

  const sourceSize = options.img.size;
  const origExceedMaxSize = tempFile.size > maxSizeByte;
  const sizeBecomeLarger = tempFile.size > sourceSize;

  // check if we need to compress or resize
  if (!origExceedMaxSize && !sizeBecomeLarger) {
    setProgress(100);
    if (options?.returnFilePath && !tempFile.tempFilePath) {
      tempFile.tempFilePath = writeFile(
        tempFile.buffer,
        outputFileType === "png" ? "png" : "jpeg",
      );
    }
    return tempFile;
  }

  const renderedSize = tempFile.size;
  let currentSize = renderedSize;
  let compressedFile;
  let newCanvas;
  let ctx;
  let canvas = orientationFixedCanvas;
  const shouldReduceResolution =
    !options.alwaysKeepResolution && origExceedMaxSize;
  while (
    remainingTrials-- &&
    (currentSize > maxSizeByte || currentSize > sourceSize)
  ) {
    const newWidth = shouldReduceResolution
      ? canvas.width * 0.95
      : canvas.width;
    const newHeight = shouldReduceResolution
      ? canvas.height * 0.95
      : canvas.height;
    [newCanvas, ctx] = await getNewCanvasAndCtx(
      newWidth,
      newHeight,
      options.selector,
    );

    ctx.drawImage(canvas, 0, 0, newWidth, newHeight);

    if (outputFileType === "png") {
      quality *= 0.85;
    } else {
      quality *= 0.95;
    }
    // eslint-disable-next-line no-await-in-loop
    compressedFile = canvasToFile(newCanvas, outputFileType, quality);

    cleanupCanvasMemory(canvas);

    canvas = newCanvas;

    currentSize = compressedFile.size;
    setProgress(
      Math.min(
        99,
        Math.floor(
          ((renderedSize - currentSize) / (renderedSize - maxSizeByte)) * 100,
        ),
      ),
    );
  }
  if (options?.returnFilePath && !compressedFile.tempFilePath) {
    compressedFile.tempFilePath = writeFile(
      compressedFile.buffer,
      outputFileType === "png" ? "png" : "jpeg",
    );
  }

  cleanupCanvasMemory(canvas);
  cleanupCanvasMemory(newCanvas);
  cleanupCanvasMemory(maxWidthOrHeightFixedCanvas);
  cleanupCanvasMemory(orientationFixedCanvas);
  cleanupCanvasMemory(origCanvas);

  setProgress(100);
  return compressedFile;
}
