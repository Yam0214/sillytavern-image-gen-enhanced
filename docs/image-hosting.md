# 图床上传

将生成的图片上传至外部图床，使用图床 CDN URL 插入对话，实现跨设备图片访问。

## 为什么需要图床？

`saveToServer + image_url` 模式下，生成的图片保存在 ST 服务器本地，URL 为 `http://服务器IP:8000/user_data/xxx.png`。换设备后 IP 变化 → 图片 404。画廊存在浏览器 `localStorage`，也不跨设备。此外，云酒馆等托管服务通常限制存储空间，大量生图会快速占满配额。图床上传解决这三个问题。

## 如何使用

1. **打开设置面板** → Output 区域 → 勾选 `Upload to image host ☁`
2. **选择 Provider** → 下拉菜单选一个图床
3. **填入 API Key**（部分 provider 需要）→ 注册对应图床获取 token/key
4. **推荐 output mode 选 `image_url`** → 对话中插入图床 CDN URL

## 支持图床一览

按梯度分为两档：

| 梯度 | 图床 | Provider ID | CORS | origin | NSFW | 需要Key | 部署要求 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **最方便** | **imgpile** ⭐ | `imgpile` | ✅ | 反射 origin | ✅ | Bearer token（免费注册） | 无需任何配置 |
| **最方便** | **Imgos** 🇨🇳 | `imgos` | ✅ | 未详细测试 | ⚠️ 不明 | token（免费注册） | 无需任何配置 |
| **最稳定** | **Imgur** | `imgur` | ✅ | `*` | ❌ | Client-ID（免费注册） | CORS 直连可用，双通道 |
| **最稳定** | **Catbox** | `catbox` | ❌ | 无 | ✅ | 无需 | **必须安装 server-plugin** |
| **最稳定** | **路过图床** 🇨🇳 | `lugu` | ❌ | 无 | ❌ | 免注册可用 | **必须安装 server-plugin** |
| — | **Custom** | `custom` | 视配置 | — | 视配置 | 视配置 | 视配置 |

**CORS 说明：**
- ✅ **有 CORS** 的图床（imgpile, Imgos, Imgur）：浏览器可以直接 POST 上传，**无需任何 ST 配置**。适合云酒馆等无管理权限的环境。
- ❌ **无 CORS** 的图床（Catbox, 路过图床）：浏览器无法直连，**必须通过 ST server-plugin 中转**。适合自建用户，需在 `config.yaml` 设置 `enableServerPlugins: true` 并安装插件。
- **免改ST** = 不需要改动 ST 源码或 `config.yaml`。纯浏览器功能，开箱即用。

## 图床详情

### imgpile
CORS + NSFW + 100MB/文件 + 1000次/天。最推荐的即插即用方案。注册 [imgpile.com](https://imgpile.com) → 账户设置生成 Bearer token 填入。

### Imgos
国内 CDN + CORS，中国大陆访问快。注册获取 token 填入。2026 年新站，长期稳定性待验证。

### Imgur
14 年老牌图床，API 最稳定。注册 [api.imgur.com/oauth2/addclient](https://api.imgur.com/oauth2/addclient) 获取 Client-ID。⚠️ 禁止 NSFW，匿名上传 6 个月无浏览可被删除。

### Catbox
免 Key + NSFW + 200MB + 永久保存。需要 server-plugin 中转（无 CORS）。注册账号可管理已上传图片，否则匿名上传不可删除。

### 路过图床
免注册国内老牌，15 年运营。图片链接格式支持多种。需要 server-plugin 中转（无 CORS）。游客上传 24 小时过期，注册后永久保存。

## API Key 获取指南

| 图床 | 注册地址 | Key 格式 | 填入方法 |
| --- | --- | --- | --- |
| imgpile | [imgpile.com/register](https://imgpile.com/register) | Bearer token（纯字符串） | 复制 token 填入 API Key 框 |
| Imgos | [imgos.cn](https://imgos.cn) | token | 复制 token 填入 |
| Imgur | [api.imgur.com/oauth2/addclient](https://api.imgur.com/oauth2/addclient) | Client-ID（纯字符串） | 复制 Client-ID 填入 |

> **注意**：API Key 框中只需填纯 key/token 字符串，不要带 `Bearer ` 或 `Client-ID ` 前缀。代码会自动添加。

## CORS 完整测试结果

对主流免费图床进行了 `curl -I` + `curl -X OPTIONS` CORS 头测试（2026-06）：

| Provider | CORS | `access-control-allow-origin` | 客户端直连 | NSFW | 备注 |
| --- | --- | --- | --- | --- | --- |
| **imgpile** | ✅ | 反射 origin | ✅ | ✅ | |
| **Imgos** | ✅ | 未详细测试 | ✅ | ⚠️ | |
| **Imgur** | ✅ | `*` | ✅ | ❌ | 删除匿名/不活跃内容 |
| **imgbb** | ✅ | `*` | ✅ | ❌ | ToS 禁止；2024年宕机频繁 |
| **SM.MS/S.EE** | ✅ | `*` | ✅ | ❌ | 2026.2 已转付费 $5.99/月起 |
| **Catbox** | ❌ | 无 | ❌ | ✅ | |
| **路过图床** | ❌ | 无 | ❌ | ❌ | 通过 web scraping 上传 |
| **FreeImage.host** | ❌ | 无 | ❌ | ✅ | |
| **Telegra.ph** | ❌ | 无 | ❌ | ⚠️ | |
| **postimages** | ❌ | 无 | ❌ | ❓ | 不提供直链 |
| **tmpfiles.org** | ✅ | `*` | ✅ | ❓ | **临时文件，自动过期** |

## 技术限制

- **ST 的 `/proxy/` 端点不转发 POST body**：multipart 返回 500，urlencoded 返回目标站首页 HTML（body 丢失）。仅对 GET/JSON POST 有效。
- **公共 CORS 代理不支持 POST**：corsproxy.io 返回 403，allorigins.win 返回 413/522。
- **server-plugin 需要 ST 重启生效**，运行中不支持热更新。
