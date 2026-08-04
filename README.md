# 记忆卡片

本地浏览器卡片记忆工具，支持 Cloudflare Pages 部署与 KV 云同步。

## 本地开发

```bash
cd ~/Documents/develop/memory-cards
nvm use 20
npm install
npm run dev
```

云同步接口只在部署到 Cloudflare Pages 后可用（依赖 Functions + KV）。

## Cloudflare Pages

1. 连接 GitHub 仓库，构建设置：
   - Build command: `npm run build`
   - Build output directory: `dist`
   - 环境变量: `NODE_VERSION=20`
2. 部署成功后，绑定 KV：
   - Cloudflare Dashboard → Workers & Pages → 你的项目 → **Settings** → **Bindings**
   - 添加 **KV Namespace** 绑定
   - Variable name 必须是：`MEMORY_KV`
   - 新建或选择一个 Namespace（如 `memory-cards-sync`）
3. 重新部署一次（或触发一次新构建），让绑定生效

## 云同步用法

打开站点 → **备份** → **云同步**：

1. 点「生成同步码」
2. 点「上传到云」
3. 在另一台设备打开同一站点，输入同一同步码 →「从云恢复」

同步码相当于密码，请自行保管。

## 功能

- 今日 / 复习（SM-2）/ 百化分冲刺 / 卡片库（标签优先）/ 曲线 / 备份与云同步
- 主题：晨雾 / 墨夜
