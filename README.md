# 🍏 微信多开管理器 (WeChat Multi Manager for macOS)

![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?style=flat-square&logo=react)
![Electron](https://img.shields.io/badge/Electron-30.x-47848F.svg?style=flat-square&logo=electron)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg?style=flat-square&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38B2AC.svg?style=flat-square&logo=tailwind-css)
![Platform](https://img.shields.io/badge/Platform-macOS-000000.svg?style=flat-square&logo=apple)

一款专为 macOS 设计的极简、优雅、现代化的微信多开管理工具。基于 Electron + React + Vite 构建，提供原生级别的界面体验和强大稳定的实例管理功能。

## ✨ 核心特性

- 🎨 **现代化 UI**：采用流畅的毛玻璃拟物设计（Vibrancy）与沉浸式无边框窗口，完美融入 macOS 设计语言。
- 🚀 **一键极速分身**：通过系统底层的 `ditto` 进行无损克隆，并自动完成应用 Bundle 信息修改与去隔离化签名，安全稳定。
- 📊 **智能状态监控**：实时扫描 `/Applications` 文件夹，精准识别官方版本与您的所有多开实例，实时监控各实例进程的运行状态。
- 🛠 **全生命周期管理**：支持一键启动、强制停止、平滑重命名（实时刷新系统缓存）以及彻底删除克隆实例。
- 🔄 **智能重构与更新**：当官方微信更新后，一键重构 (Reconstruct All) 所有分身，无缝继承旧版名称信息，永远保持与官方架构同步。
- ⚡ **全局进程控制**：支持一键强制结束所有微信关联进程，释放系统资源。

## 💡 工作原理 (How it works?)

相较于传统的修改二进制文件或注入外部脚本，本应用采用了极度绿色安全的**浅克隆与身份重置方案**：
1. **完整克隆**：使用 macOS 底层的高效复制工具 `ditto` 无损备份官方微信 `.app` 目录。
2. **身份隔离**：通过修改 `.app/Contents/Info.plist`，赋予每个分身独一无二的 `CFBundleIdentifier` 和 `CFBundleDisplayName`。
3. **安全签名**：移除原有的阻止运行的 Quarantine 隔离属性，清洗多语言锁，并利用 `codesign` 为新包剥离时间戳重新签名，彻底解决系统弹出的“应用已损坏”或“移至废纸篓”报错。
4. **系统注册**：自动调用 CoreServices 中的 `lsregister` 强制刷新 LaunchServices 缓存并重启 Dock，使分身和原生应用拥有完全一致的桌面启动体验。

> *注：因涉及 `/Applications` 目录写入以及系统级签名刷新，执行相关操作时会通过 `sudo-prompt` 向用户请求一次性的管理员密码授权。*

## 🛠 技术栈

- **框架支持**：`Electron` 30 + `React` 18
- **极速构建**：`Vite` 5 (支持快速热更新 HMR)
- **视觉样式**：`Tailwind CSS` v4 (@tailwindcss/vite)
- **优雅图标**：`lucide-react`
- **提权交互**：`sudo-prompt`
- **语言支持**：全栈 `TypeScript`

## 📦 如何在本地运行

### 环境要求
- macOS 操作系统
- [Node.js](https://nodejs.org/) (推荐 v18 或以上版本)
- 请确保您的电脑中已安装[官方正版微信](https://mac.weixin.qq.com/)并将其位于默认的 `/Applications/WeChat.app` 目录中。

### 安装与启动步骤

1. 克隆项目到本地：
```bash
git clone https://github.com/your-username/wechat-multi-app.git
cd wechat-multi-app
```

2. 安装所有依赖模块：
```bash
npm install
```

3. 启动开发模式：
```bash
npm run dev
```

### 构建与打包发布
如果您需要将其构建为可以在其他 Mac 上安装和分发的 `.dmg` 或 `.app` 包：
```bash
npm run build
```
构建成功后，可执行安装包将生成在 `release/` 目录中（由 `electron-builder`驱动）。

## ⚠️ 免责声明 (Disclaimer)

1. 本项目**仅用于技术研究、学习与交流目的**。开发者并未对微信的任何底层核心二进制文件（Mach-O）进行破解、逆向或非法篡改。
2. 本工具提供的仅是如何通过系统机制达成环境隔离与快捷复制的方法。**在任何情况下，使用者因该工具引起的数据丢失、账号风控（封号）及其他问题与损失，由使用者自行承担风险和责任。**
3. 请合理使用多开功能，严格遵守《腾讯微信软件许可及服务协议》。不要用于任何商业和非法用途。

---

## ☕ 赞赏与支持

如果您觉得这个工具对您有帮助，欢迎**请我喝杯奶茶**作为鼓励！您的支持是我持续更新与维护的最大动力 ❤️

<div align="center">
  <img src="./assets/微信收款码.jpg" width="250" alt="微信赞赏码"/>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./assets/支付宝收款码.jpg" width="250" alt="支付宝赞赏码"/>
</div>
