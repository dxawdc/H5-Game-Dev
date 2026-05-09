# 占位素材替换指南

## 替换步骤

1. 将真实素材放入对应目录（路径见下表）
2. 在场景脚本中将 `PlaceholderAssets.getEntityColor()` / `createPlaceholderRect()`
   替换为 `new Image()` 加载 `/assets/...` 路径下的真实素材
3. 替换完成后执行：`cd web_project && npm run build` 验证构建无报错

## 素材对照表

| 实体/界面 ID | 占位色 | 真实文件名 | 目标路径 |
|------------|-------|-----------|---------|
| boss_default | #E53935 | boss_default.png | /assets/characters/boss_default.png |
| boss_bruised | #E53935 + 特效 | boss_bruised.png | /assets/characters/boss_bruised.png |
| boss_smug | #E53935 + 特效 | boss_smug.png | /assets/characters/boss_smug.png |
| player_obstacle | #795548 | obstacle_player.png | /assets/ui/obstacle_player.png |
| map_obstacle | #9E9E9E | obstacle_map.png | /assets/ui/obstacle_map.png |
| item_extra_step | #4CAF50 | icon_extra_step.png | /assets/icons/icon_extra_step.png |
| item_undo | #2196F3 | icon_undo.png | /assets/icons/icon_undo.png |
| item_reset | #FF9800 | icon_reset.png | /assets/icons/icon_reset.png |
| item_hint | #FFD700 | icon_hint.png | /assets/icons/icon_hint.png |
| grid_point | #BDBDBD | grid_tile.png | /assets/ui/grid_tile.png |
| grid_edge | #E0E0E0 | grid_tile.png | /assets/ui/grid_tile.png |
| loading | #ECEFF1 | bg_loading.png | /assets/backgrounds/bg_loading.png |
| main_menu | #FFF8E1 | bg_main_menu.png | /assets/backgrounds/bg_main_menu.png |
| game_level | #F5F0E8 | bg_game_level.png | /assets/backgrounds/bg_game_level.png |
| logo | — | logo.png | /assets/ui/logo.png |
| btn_primary | — | btn_primary.png | /assets/ui/btn_primary.png |
| btn_secondary | — | btn_secondary.png | /assets/ui/btn_secondary.png |

## 音效文件清单

| 文件名 | 目标路径 | 时长 | 说明 |
|-------|---------|------|------|
| sfx_place.mp3 | /assets/effects/sfx_place.mp3 | 0.3s | 放置障碍物 |
| sfx_boss_move.mp3 | /assets/effects/sfx_boss_move.mp3 | 0.2s | Boss移动 |
| sfx_win.mp3 | /assets/effects/sfx_win.mp3 | 1.5s | 胜利音效 |
| sfx_fail.mp3 | /assets/effects/sfx_fail.mp3 | 1.0s | 失败音效 |
| sfx_item.mp3 | /assets/effects/sfx_item.mp3 | 0.5s | 获取道具 |
| sfx_button.mp3 | /assets/effects/sfx_button.mp3 | 0.1s | 按钮点击 |

## AI 生图

完整提示词见 reports/art_requirements.md
