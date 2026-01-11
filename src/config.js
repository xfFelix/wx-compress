/**
 * ## 最大canvas分辨率
 * 根据微信小程序官方规范，Canvas 2D 的默认画布尺寸为 300*150 物理像素。实际开发中需注意以下要点：
 * 最大物理尺寸限制：
 * 系统层面对画布物理像素的尺寸有硬性限制（安卓平台最大单边长度一般为 4096，iOS 为 4096），当设置的逻辑尺寸（canvas.width/canvas.height）乘以设备像素比（dpr）后超出该限制时，会出现尺寸错误。
 * 开发建议：
 * 推荐通过设备像素比自动适配尺寸：
 * const dpr = wx.getWindowInfo().pixelRatio
 * canvas.width = renderWidth * dpr
 * canvas.height = renderHeight * dpr
 * ctx.scale(dpr, dpr)
 * 手动设置大尺寸时需验证乘积：
 * // 示例计算（假设设备像素比为3）
 * 5000*3 = 15000 > 4096 // 会触发系统级错误
 * 特殊现象说明：
 * 不同设备/平台的物理像素限制可能不同，这解释了为何5000*5000在某些设备能显示（实际渲染尺寸未超出物理限制），而更大尺寸会报错。建议保持单边逻辑尺寸不超过1365以兼容所有设备。
 * https://developers.weixin.qq.com/community/develop/doc/0002461b0941d8f509335b74361800?highLine=canvas
 */
export const MAX_CANVAS_SIZE = 4096;

export const ORIENTATION_MAP = {
  up: 1,
  "up-mirrored": 2,
  down: 3,
  "down-mirrored": 4,
  left: 8,
  "left-mirrored": 5,
  right: 6,
  "right-mirrored": 7,
};
