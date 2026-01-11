# wx-compress

微信小程序图片压缩，在微信小程序上一般是使用 `wx.compressImage` 进行压缩，但是查看过原理的都知道，其实是使用 canvas 进行压缩，这种方案只支持 jpeg 和 webp 的格式，对于 png 格式是无效的，并且压缩不能过配置分辨率压缩和最大值压缩，这两种情况在我们业务中是非常常见的，为了解决这两个问题，所以特地写了这个库来实现对 png 文件的压缩，通过配置 `maxSizeMB` 和 `maxWidthOrHeight` 来进行分辨率和图片压缩，压缩默认采用分辨率和质量的同时压缩，如何设置了 `alwaysKeepResolution`, 那么就会采用质量压缩，但是如果传入的图片分辨率相乘超过 `4096 * 4096`, 那么还是会压缩到 `4096 * 4096` 以下

## Install

```bash
npm i wx-compress
```

## Usage

```js
import compress from 'wx-compress';

handleChoose() {
  wx.chooseMedia({
    mediaType: ["image"],
    success: async (res) => {
      console.log(res);
      this.setData({ originUrl: res.tempFiles[0].tempFilePath });
      const compressFile = await compress(res.tempFiles[0].tempFilePath, {
        maxSizeMB: 10,
        returnFilePath: true
      });
      console.log(compressFile);
      this.setData({ url: compressFile.tempFilePath });
    },
  });
}
```

## Options

| 参数名               | 描述                 | 是否必填 | 默认值                     | 范围       |
| :------------------- | :------------------- | :------- | :------------------------- | ---------- |
| maxSizeMB            | 压缩上限             | 否       | Number.POSITIVE_INFINITY   | --         |
| maxWidthOrHeight     | 分辨率上限           | 否       | undefined                  | [0-4096]   |
| maxIteration         | 压缩次数             | 否       | 10                         |
| fileType             | 图片类型             | 否       | 输入的图片类型             | [png,jpeg] |
| initialQuality       | 压缩质量             | 否       | 1                          |
| alwaysKeepResolution | 始终保持分辨率       | 否       | false                      |
| selector             | canvasId             | 否       | canvas                     |
| returnFilePath       | 是否返回tempFilePath | 否       | false                      |
| onProgress           | 压缩进度             | 否       | (progress: number) => void |

## Return

| 参数名       | 描述            | 是否必填 | 类型        |
| :----------- | :-------------- | :------- | :---------- |
| buffer       | 文件ArrayBuffer | 是       | ArrayBuffer |
| fileType     | 文件类型        | 是       | [jpeg, png] |
| size         | 文件大小        | 是       | number      |
| width        | 图片宽度        | 是       | number      |
| height       | 图片高度        | 是       | 1           |
| tempFilePath | 文件地址        | 否       | string      |

- tempFilePath: 必须要在 `returnFilePath` 为 `true` 时才会返回，建议当我们使用cos的putObject请求时，传递buffer，这样就可以不用写入文件，文件的写入经常遇到大小的限制
