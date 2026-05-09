// PlaceholderAssets.ts
// 职责：程序化占位素材，真实美术就位前保证游戏可运行
// 依赖：无

export class PlaceholderAssets {
  // 实体占位颜色（基于 art_style.color_palette，必须覆盖所有实体 ID）
  static readonly ENTITY_COLORS: Record<string, string> = {
    boss_default: '#E53935',       // 红色系 - Boss 角色
    player_obstacle: '#795548',    // 棕色 - 玩家放置障碍物
    map_obstacle: '#9E9E9E',      // 灰色 - 地图固定障碍物
    item_extra_step: '#4CAF50',    // 绿色 - 多走1步道具
    item_undo: '#2196F3',          // 蓝色 - 返回上1步道具
    item_reset: '#FF9800',         // 橙色 - 重置本关道具
    item_hint: '#FFD700',          // 金色 - 提示道具
    grid_point: '#BDBDBD',         // 浅灰色 - 网格交点
    grid_edge: '#E0E0E0',          // 更浅灰色 - 网格边
  }

  // 界面背景色（必须覆盖所有 ui_screens ID）
  static readonly BACKGROUND_COLORS: Record<string, string> = {
    loading: '#ECEFF1',            // 浅灰蓝 - 加载页
    main_menu: '#FFF8E1',          // 暖奶油色 - 主界面
    game_level: '#F5F0E8',         // 浅米色 - 关卡界面
    level_win: '#FFF3E0',          // 暖金色 - 通关成功
    level_fail: '#ECEFF1',         // 冷灰色 - 通关失败
    settings: 'rgba(0,0,0,0.5)',   // 半透明黑 - 设置弹窗
    leaderboard: 'rgba(0,0,0,0.5)', // 半透明黑 - 排行榜弹窗
    item_popup: 'rgba(0,0,0,0.4)', // 半透明黑 - 道具获得弹窗
  }

  static getEntityColor(entityId: string): string {
    return this.ENTITY_COLORS[entityId] || '#cccccc'
  }

  static getBackgroundColor(sceneId: string): string {
    return this.BACKGROUND_COLORS[sceneId] || '#f2f2f2'
  }

  static createPlaceholderRect(color: string, width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = color
      ctx.fillRect(0, 0, width, height)
      // 添加边框以便视觉区分
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'
      ctx.lineWidth = 1
      ctx.strokeRect(0.5, 0.5, width - 1, height - 1)
    }
    return canvas
  }
}
