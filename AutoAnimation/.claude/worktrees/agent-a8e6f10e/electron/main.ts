import { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme, session } from 'electron'
import path from 'path'
import url from 'url'
import fs from 'fs'
import { startServer, stopServer } from './server'

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------

let mainWindow: BrowserWindow | null = null

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
const isDev = !!process.env.VITE_DEV_SERVER_URL || !app.isPackaged

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------

function createWindow(): void {
  const isMac = process.platform === 'darwin'

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: '#09090b',
    titleBarStyle: isMac ? 'hiddenInset' : undefined,
    frame: isMac ? undefined : true,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: isDev,
      sandbox: false,
    },
  })

  // Forward renderer console messages to main process stdout
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const tag = ['LOG', 'WARN', 'ERROR'][level] || 'LOG'
    console.log(`[renderer ${tag}] ${message} (${sourceId}:${line})`)
  })

  // Prevent white flash — show only when the renderer is painted
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ---------------------------------------------------------------------------
// Security — Content Security Policy
// ---------------------------------------------------------------------------

function setupCSP(): void {
  // Only apply CSP in dev mode — in production the app loads from file://
  // where 'self' resolves to null origin and blocks all scripts
  if (!isDev) return

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https:",
            "media-src 'self' data: blob: https:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' ws: wss: http://localhost:* https:",
            "worker-src 'self' blob:",
          ].join('; '),
        ],
      },
    })
  })
}

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

function registerIpcHandlers(): void {
  // ---- Dialogs ------------------------------------------------------------

  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Video', extensions: ['mp4', 'webm', 'mov'] },
        { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a'] },
        { name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle(
    'dialog:saveFile',
    async (_event, options: { defaultName: string; filters: { name: string; extensions: string[] }[] }) => {
      const result = await dialog.showSaveDialog({
        defaultPath: options.defaultName,
        filters: options.filters,
      })
      if (result.canceled) return null
      return result.filePath
    },
  )

  // ---- File system --------------------------------------------------------

  ipcMain.handle('fs:writeFile', async (_event, { filePath, data }: { filePath: string; data: ArrayBuffer }) => {
    await fs.promises.writeFile(filePath, Buffer.from(data))
    return true
  })

  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    const buffer = await fs.promises.readFile(filePath)
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  })

  // ---- App paths ----------------------------------------------------------

  ipcMain.handle('app:getPath', (_event, name: 'userData' | 'temp' | 'downloads' | 'documents') => {
    return app.getPath(name)
  })

  // ---- Shell --------------------------------------------------------------

  ipcMain.handle('shell:openExternal', async (_event, externalUrl: string) => {
    await shell.openExternal(externalUrl)
  })

  ipcMain.handle('shell:showItemInFolder', (_event, itemPath: string) => {
    shell.showItemInFolder(itemPath)
  })

  // ---- Window controls ----------------------------------------------------

  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(async () => {
  setupCSP()
  registerIpcHandlers()

  startServer().catch((err) => console.error('[server] failed to start:', err))

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', async () => {
  await stopServer()
})
