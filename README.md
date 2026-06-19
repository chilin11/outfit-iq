# AI 穿搭评分

穿搭拍照 → AI 视觉模型评分 + 维度分析 + 改造建议。跨 iOS / Android。

## 效果

- 主图区 + 大圆角卡片
- Hero 总评分卡（变色背景 + 等级徽章）
- 维度评分进度条（色彩 / 版型 / 层次 / 风格 + 合身）
- 单品识别彩色标签
- 造型师手记：亮点 / 待改进 / 改造建议
- 完全折叠 UI — 默认只露最核心的

## 开发跑起来

```bash
npm install
npm start
```

手机扫码（iOS / Android 上装 "Expo Go"）。

第一次进 App → 右上角「⚙ 设置」填 API URL / Key / 模型：
- API Base URL：`https://api.anthropic.com`（或自建代理）
- API Key：`sk-ant-...`
- Model：`claude-sonnet-4-5`

保存后拍照或选图即可评分。Key 只在本机 AsyncStorage，不上传。

## 打包 Android APK

```bash
# 1. 装 eas-cli（一次性）
npm install -g eas-cli

# 2. 注册 / 登录 Expo 账号（一次性）
eas login

# 3. 第一次构建会在云端跑（5-10 分钟）
eas build --profile preview --platform android

# 完成后会给你一个 APK 下载链接
# 直接发给朋友 / 装到自己手机
```

构建类型说明（`eas.json` 已配置）：
- `preview` → 出 **APK**，可直接安装到任何 Android 设备（开发用、给朋友试用）
- `production` → 出 **AAB**，上 Google Play 用

## 打包 iOS / TestFlight

需要 Apple Developer 账号（$99/年）。配置好之后：

```bash
eas build --profile preview --platform ios   # 出 IPA
eas submit --platform ios                    # 提交到 TestFlight
```

第一次提交苹果会有一次应用审核（1-3 天），之后更新很快。

## 目录结构

```
ai-dress/
├── App.tsx                        # 入口
├── app.json                       # Expo 配置（权限、图标）
├── eas.json                       # EAS Build 配置
├── package.json
├── src/
│   ├── theme.ts                   # 中性 + 品牌紫调色板
│   ├── fonts.ts                   # iOS System / Android sans-serif
│   ├── types.ts                   # AppConfig / RatingResult
│   ├── lib/
│   │   ├── storage.ts             # AsyncStorage 配置 + 历史
│   │   ├── api.ts                 # 非流式 API 调用 + JSON 解析
│   │   ├── image.ts               # 压图到 512px / JPEG 0.5
│   │   └── prompt.ts              # 系统 / 用户 prompt
│   ├── screens/
│   │   ├── HomeScreen.tsx         # 主屏 + 拍照 / 评分
│   │   └── SettingsScreen.tsx     # API 配置
│   └── components/
│       └── ResultView.tsx         # 评分结果展示（折叠 UI）
```

## 设计取舍

- **不引第三方 UI 库**：所有视觉细节 StyleSheet 手写，主题可控、包体小
- **不接后端**：API Key 存本机，App 直接调模型。担心 Key 泄露可走 Cloudflare Worker 中转，把代理地址填到「API Base URL」
- **压图到 512px / JPEG 0.5**：base64 体积小、API 响应快
- **非流式**：流式在第三方代理下不稳定，非流式一次返回简单可靠
- **4 维度快速 / 5 维度详细**：日常用户 4 个维度够用，详细档加合身

## 后续可加

- 历史记录列表（数据已存 `loadHistory`）
- 多角度分析
- 分享卡片（导出到相册）
- 离线缓存（最近的评分）
- 主题切换

## License

MIT