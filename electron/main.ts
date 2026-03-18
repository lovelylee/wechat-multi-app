import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { WeChatManager } from './wechat-manager'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    width: 1200,
    height: 800,
    minWidth: 1200,
    minHeight: 800,
    resizable: false, // User requested fixed window
    maximizable: false,
    titleBarStyle: 'hiddenInset', // Mac style
    vibrancy: 'sidebar', // Glass effect
    trafficLightPosition: { x: 12, y: 12 },
    backgroundColor: '#00000000', // Transparent
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// IPC Handlers
function setupHandlers() {
  ipcMain.handle('wechat:check', () => WeChatManager.checkInstallation())
  ipcMain.handle('wechat:scan', () => WeChatManager.scanInstances())
  ipcMain.handle('wechat:create', async (_, name: string, count: number) => {
    await WeChatManager.createInstances(name, count)
    return true
  })
  ipcMain.handle('wechat:launch', async (_, path: string) => {
    await WeChatManager.launchInstance(path)
  })
  ipcMain.handle('wechat:delete', async (_, path: string) => {
    await WeChatManager.deleteInstance(path)
  })
  ipcMain.handle('wechat:running', async () => {
    return WeChatManager.getRunningInstances()
  })
  ipcMain.handle('wechat:stop', async (_, path: string) => {
    await WeChatManager.stopInstance(path)
  })
  ipcMain.handle('wechat:rename', async (_, oldPath: string, newName: string) => {
    await WeChatManager.renameInstance(oldPath, newName)
  })
  ipcMain.handle('wechat:reconstructAll', async () => {
    await WeChatManager.reconstructAll()
  })
  ipcMain.handle('wechat:killAll', async () => {
    await WeChatManager.killAll()
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  setupHandlers()
  createWindow()
})
