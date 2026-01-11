import UPNG from "./UPNG";
import { MAX_CANVAS_SIZE } from "./config";

/**
 * approximateBelowCanvasMaximumSizeOfBrowser
 *
 * it uses binary search to converge below the browser's maximum Canvas size.
 *
 * @param {number} initWidth
 * @param {number} initHeight
 * @returns {object}
 */
export function approximateBelowMaximumCanvasSizeOfBrowser(
  initWidth,
  initHeight,
) {
  const maximumCanvasSize = MAX_CANVAS_SIZE;

  let width = initWidth;
  let height = initHeight;
  let size = width * height;
  const ratio = width > height ? height / width : width / height;

  while (size > maximumCanvasSize * maximumCanvasSize) {
    const halfSizeWidth = (maximumCanvasSize + width) / 2;
    const halfSizeHeight = (maximumCanvasSize + height) / 2;
    if (halfSizeWidth < halfSizeHeight) {
      height = halfSizeHeight;
      width = halfSizeHeight * ratio;
    } else {
      height = halfSizeWidth * ratio;
      width = halfSizeWidth;
    }

    size = width * height;
  }

  return {
    width,
    height,
  };
}

/**
 * get new Canvas and it's context
 * @param width
 * @param height
 * @returns {[HTMLCanvasElement | OffscreenCanvas, CanvasRenderingContext2D]}
 */
export function getNewCanvasAndCtx(width, height, selector = "canvas") {
  return new Promise((resolve, reject) => {
    let canvas;
    let ctx;
    canvas = wx.createOffscreenCanvas({
      type: "2d",
      width: width,
      height: height,
    });
    ctx = canvas.getContext("2d");
    if (ctx === null) {
      const query = wx.createSelectorQuery();
      query
        .select(`#${selector}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res?.[0]?.node) {
            canvas = res[0].node;
            ctx = canvas.getContext("2d");
            resolve([canvas, ctx]);
          } else {
            reject(new Error("未检测到id=canvas的DOM元素"));
          }
        });
    } else {
      resolve([canvas, ctx]);
    }
  });
}

/**
 * drawImageInCanvas
 *
 * @param {string} file
 * @param {options} [fileType=undefined]
 * @returns {HTMLCanvasElement | OffscreenCanvas}
 */
export async function drawImageInCanvas(file, options) {
  try {
    const { img } = options;
    const fileType = options.fileType || img.type;
    const { width, height } = approximateBelowMaximumCanvasSizeOfBrowser(
      img.width,
      img.height,
    );
    const [canvas, ctx] = await getNewCanvasAndCtx(
      width,
      height,
      options.selector,
    );
    const image = await loadImage(file, canvas);
    if (fileType && /jpe?g/.test(fileType)) {
      ctx.fillStyle = "white"; // to fill the transparent background with white color for png file in jpeg extension
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * canvasToFile
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas
 * @param {string} fileType
 * @param {string} fileName
 * @param {number} fileLastModified
 * @param {number} [quality]
 * @returns {Promise<File | Blob>}
 */
export function canvasToFile(canvas, fileType, quality = 1) {
  const ctx = canvas.getContext("2d");
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let buffer;
  if (fileType === "png") {
    const png = UPNG.encode(
      [data.buffer],
      canvas.width,
      canvas.height,
      4096 * quality,
    );
    buffer = png;
  } else {
    let base64 = canvas.toDataURL("image/jpeg", quality);
    base64 = base64.replace(/^data:image\/\w+;base64,/, "");
    buffer = wx.base64ToArrayBuffer(base64);
  }
  return {
    buffer,
    size: buffer.byteLength,
    width: canvas.width,
    height: canvas.height,
    tempFilePath: "",
    fileType
  };
}

/**
 * clear Canvas memory
 * @param canvas
 * @returns null
 */
export function cleanupCanvasMemory(canvas) {
  // garbage clean canvas for safari
  // ref: https://bugs.webkit.org/show_bug.cgi?id=195325
  // eslint-disable-next-line no-param-reassign
  canvas.width = 0;
  // eslint-disable-next-line no-param-reassign
  canvas.height = 0;
}

/**
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas
 * @param options
 * @returns {HTMLCanvasElement | OffscreenCanvas}
 */
export async function handleMaxWidthOrHeight(canvas, options) {
  try {
    const { width, height } = canvas;
    const { maxWidthOrHeight, selector } = options;

    const needToHandle =
      isFinite(maxWidthOrHeight) &&
      (width > maxWidthOrHeight || height > maxWidthOrHeight);

    let newCanvas = canvas;
    let ctx;

    if (needToHandle) {
      [newCanvas, ctx] = await getNewCanvasAndCtx(width, height, selector);
      if (width > height) {
        newCanvas.width = maxWidthOrHeight;
        newCanvas.height = (height / width) * maxWidthOrHeight;
      } else {
        newCanvas.width = (width / height) * maxWidthOrHeight;
        newCanvas.height = maxWidthOrHeight;
      }
      ctx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);

      cleanupCanvasMemory(canvas);
    }

    return newCanvas;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * followExifOrientation
 * source: https://stackoverflow.com/a/40867559/10395024
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas
 * @param {number} exifOrientation
 * @returns {HTMLCanvasElement | OffscreenCanvas} canvas
 */
export async function followExifOrientation(canvas, exifOrientation) {
  try {
    const { width, height } = canvas;

    const [newCanvas, ctx] = await getNewCanvasAndCtx(width, height);

    // set proper canvas dimensions before transform & export
    if (exifOrientation > 4 && exifOrientation < 9) {
      newCanvas.width = height;
      newCanvas.height = width;
    } else {
      newCanvas.width = width;
      newCanvas.height = height;
    }

    // transform context before drawing image
    switch (exifOrientation) {
      case 2:
        ctx.transform(-1, 0, 0, 1, width, 0);
        break;
      case 3:
        ctx.transform(-1, 0, 0, -1, width, height);
        break;
      case 4:
        ctx.transform(1, 0, 0, -1, 0, height);
        break;
      case 5:
        ctx.transform(0, 1, 1, 0, 0, 0);
        break;
      case 6:
        ctx.transform(0, 1, -1, 0, height, 0);
        break;
      case 7:
        ctx.transform(0, -1, -1, 0, height, width);
        break;
      case 8:
        ctx.transform(0, -1, 1, 0, 0, width);
        break;
      default:
        break;
    }

    ctx.drawImage(canvas, 0, 0, width, height);

    cleanupCanvasMemory(canvas);

    return newCanvas;
  } catch (error) {
    throw error;
  }
}

export function getImageInfo(file) {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src: file,
      success: (res) => {
        resolve(res);
      },
      fail: (err) => {
        reject(new Error(err.errMsg));
      },
    });
  });
}

export function getFileSize(src) {
  return new Promise((resolve, reject) => {
    const fileManager = wx.getFileSystemManager();
    fileManager.getFileInfo({
      filePath: src,
      success: (res) => {
        resolve(res.size);
      },
      fail: (err) => {
        reject(new Error(err.errMsg));
      },
    });
  });
}

/**
 * loadImage
 *
 * @param {string} src
 * @returns {Promise<Image>}
 */
export function loadImage(src, canvas) {
  return new Promise((resolve, reject) => {
    const img = canvas.createImage();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export function writeFile(data, suffix) {
  const filePath = wx.env.USER_DATA_PATH + "/" + generateUUID() + "." + suffix;
  const fileManager = wx.getFileSystemManager();
  try {
    fileManager.writeFileSync(filePath, data, "binary");
    return filePath;
  } catch (error) {
    console.log(error);
    if (
      error?.message?.includes(
        "the maximum size of the file storage limit is exceeded",
      )
    ) {
      try {
        const files = fileManager.readdirSync(wx.env.USER_DATA_PATH);
        console.log("files", files);
        // 忽略历史记录文件
        const deleteFiles =
          files?.filter((m) => m.indexOf("miniprogramLog") === -1) || [];
        if (deleteFiles.length > 0) {
          deleteFiles.forEach((m) => {
            fileManager.unlinkSync(`${wx.env.USER_DATA_PATH}/${m}`);
          });
        }
        fileManager.writeFileSync(filePath, data, "binary");
        return filePath;
      } catch (error) {
        throw error;
      }
    } else {
      throw error;
    }
  }
}

/**
 * 生成UUID
 * @returns {string} 返回生成的UUID字符串
 */
export function generateUUID() {
  // 使用crypto API (如果环境支持)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // 降级方案：使用Math.random()实现
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
