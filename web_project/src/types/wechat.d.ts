// wechat.d.ts
// 职责：微信小游戏全局 API 类型声明
// 用于 wx 全局对象的类型检查

interface KVDataItem {
  key: string
  value: string
}

interface FriendCloudStorageData {
  nickname: string
  avatarUrl: string
  KVDataList: KVDataItem[]
}

interface SetFriendCloudStorageOptions {
  KVDataList: KVDataItem[]
  success: () => void
  fail: (err: unknown) => void
}

interface GetFriendCloudStorageOptions {
  keyList: string[]
  success: (res: { data: FriendCloudStorageData[] }) => void
  fail: (err: unknown) => void
}

interface ShareAppMessageOptions {
  title: string
  imageUrl: string
  query: string
}

interface RewardedVideoAd {
  show: () => Promise<void> | void
  load: () => Promise<void> | void
  onClose: (callback: (res: { isEnded?: boolean }) => void) => void
  onError: (callback: (err: unknown) => void) => void
}

interface CreateRewardedVideoAdOptions {
  adUnitId: string
}

interface VibrateShortOptions {
  type: 'medium' | 'heavy' | 'light'
}

interface Wx {
  setFriendCloudStorage(options: SetFriendCloudStorageOptions): void
  getFriendCloudStorage(options: GetFriendCloudStorageOptions): void
  shareAppMessage(options: ShareAppMessageOptions): void
  createRewardedVideoAd(options: CreateRewardedVideoAdOptions): RewardedVideoAd
  vibrateShort(options: VibrateShortOptions): void
}

declare const wx: Wx
