export interface Options {
  /** @default Number.POSITIVE_INFINITY */
  maxSizeMB?: number;
  /** @default undefined */
  maxWidthOrHeight?: number;
  /** @default 10 */
  maxIteration?: number;
  /** A function takes one progress argument (progress from 0 to 100) */
  onProgress?: (progress: number) => void;
  /** Default to be the original mime type from the image file */
  fileType?: 'png' | 'jpeg';
  /** @default 1.0 */
  initialQuality?: number;
  /** @default false */
  alwaysKeepResolution?: boolean;
  /** @default undefined */
  selector?: string;
  /** @default false */
  returnFilePath: boolean;
}

export interface Returns {
  /** 文件ArrayBuffer */
  buffer: ArrayBuffer;
  /** 文件大小 */
  size: number;
  /** 文件类型 */
  fileType: 'jpeg' | 'png';
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 文件地址 */
  tempFilePath: string;
}

declare function imageCompression(image: File, options: Options): Promise<Returns>;

export default imageCompression;
