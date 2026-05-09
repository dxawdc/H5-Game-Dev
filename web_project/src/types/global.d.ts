// global.d.ts
// 职责：全局类型声明，用于微信小程序 API 等外部环境

declare const wx: {
  createRewardedVideoAd(config: { adUnitId: string }): unknown
  shareAppMessage(config: { title: string; imageUrl: string; query: string }): void
  vibrateShort(config: { type: string }): void
  setFriendCloudStorage(config: {
    KVDataList: Array<{ key: string; value: string }>
    success: () => void
    fail: (err: unknown) => void
  }): void
  getFriendCloudStorage(config: {
    keyList: string[]
    success: (res: unknown) => void
    fail: (err: unknown) => void
  }): void
}
