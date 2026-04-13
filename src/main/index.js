import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import path, { join } from 'path'
import { execFile, spawn } from 'child_process'
import { promisify } from 'util'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs'
import crypto from 'crypto'
import __Store from 'electron-store'
const Store = __Store.default || __Store

import icon from '../../resources/icon.png?asset'
import config from '../../launcher-config.json'

const store = new Store({
  defaults: {
    selectedClient: '64-bit DirectX',
    autoPlay: false,
    closeOnLaunch: false
  }
})

const execFileAsync = promisify(execFile)
let mainWindow = null
let trackedClientProcess = null
let launchInFlight = false
let clientRunningLock = false
let clientRunningPoll = null
const launcherTokenFileName = 'launcher-token.txt'

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    resizable: false,
    frame: false,
    show: false,
    transparent: true,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // mainWindow.webContents.openDevTools()

  return mainWindow
}

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
if (gotSingleInstanceLock) {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
  })

  app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Access-Control-Allow-Origin': ['*']
        }
      })
    })

    createWindow()

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    ipcMain.handle('get-window-pos', () => {
      if (!mainWindow) return [0, 0]
      return mainWindow.getPosition()
    })

    ipcMain.on('move-window', (event, { dx, dy, base }) => {
      if (!mainWindow) return
      mainWindow.setPosition(base[0] + dx, base[1] + dy)
    })

    ipcMain.handle('set-ignore', (e, ignore) => {
      mainWindow.setIgnoreMouseEvents(ignore, { forward: true })
    })

    ipcMain.handle('minimize-window', () => {
      mainWindow.minimize()
    })

    ipcMain.handle('close-window', () => {
      mainWindow.close()
    })

    ipcMain.handle('get-config', (e, key) => {
      return config[key]
    })

    ipcMain.handle('write-file', async (e, relativePath, data) => {
      const sessionPath = app.isPackaged ? app.getPath('userData') : app.getAppPath()
      const filePath = join(sessionPath, 'otclient', relativePath)
      const dirname = path.dirname(filePath)
      const exist = await directoryExists(dirname)
      if (!exist) {
        await fs.promises.mkdir(dirname, { recursive: true })
      }

      await fs.promises.writeFile(filePath, Buffer.from(data))
    })

    ipcMain.handle('start-game', async () => {
      if (launchInFlight) {
        return { ok: false, reason: 'launching' }
      }

      const hasLaunchLock = await acquireClientLaunchLock()
      if (!hasLaunchLock) {
        return { ok: false, reason: 'already-running' }
      }

      if (await isAnyClientRunning()) {
        await releaseClientLaunchLock()
        return { ok: false, reason: 'already-running' }
      }

      const sessionPath = app.isPackaged ? app.getPath('userData') : app.getAppPath()
      const selectedClient = store.get('selectedClient')
      const clientExecutable = config.CLIENTS[selectedClient]
      if (!clientExecutable) {
        await releaseClientLaunchLock()
        return { ok: false, reason: 'missing-client' }
      }

      const clientPath = join(sessionPath, 'otclient', clientExecutable)
      const exists = await fileExists(clientPath)
      if (!exists) {
        await releaseClientLaunchLock()
        return { ok: false, reason: 'missing-executable' }
      }

      await writeLauncherToken(sessionPath)

      launchInFlight = true

      try {
        const child = spawn(clientPath, [], {
          cwd: path.dirname(clientPath),
          detached: true,
          stdio: 'ignore'
        })

        await new Promise((resolve, reject) => {
          child.once('spawn', resolve)
          child.once('error', reject)
        })

        trackedClientProcess = child
        clientRunningLock = true
        ensureClientRunningPoll()
        child.once('exit', () => {
          if (trackedClientProcess?.pid === child.pid) {
            trackedClientProcess = null
          }
        })
        child.unref()
      } catch (error) {
        console.error('Failed to start client:', error)
        await clearLauncherToken(sessionPath)
        await releaseClientLaunchLock()
        return { ok: false, reason: 'launch-failed', message: error.message }
      } finally {
        launchInFlight = false
      }

      if (store.get('closeOnLaunch') && !store.get('autoPlay')) {
        mainWindow?.close()
      }

      return { ok: true }
    })

    ipcMain.handle('get-game-state', async () => {
      return {
        running: await isAnyClientRunning(),
        launchInFlight
      }
    })

    ipcMain.handle('clean-client', async (e, manifest) => {
      const sessionPath = app.isPackaged ? app.getPath('userData') : app.getAppPath()
      const clientDir = join(sessionPath, 'otclient')

      const exists = await directoryExists(clientDir)
      if (!exists) return

      const files = await fs.promises.readdir(clientDir, { withFileTypes: true, recursive: true })
      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(file.path, file.name)
          const relativeFilePath = path.relative(clientDir, filePath).replace(/\\/g, '/')
          if (!manifest[relativeFilePath]) {
            await fs.promises.unlink(join(clientDir, relativeFilePath))
          }
        }
      }
    })

    ipcMain.handle('read-client-files', async () => {
      const sessionPath = app.isPackaged ? app.getPath('userData') : app.getAppPath()
      const clientDir = join(sessionPath, 'otclient')

      const exists = await directoryExists(clientDir)
      if (!exists) return {}

      const files = await fs.promises.readdir(clientDir, { withFileTypes: true, recursive: true })
      const localFiles = {}

      const tasks = files.map(
        (file) =>
          new Promise((resolve, reject) => {
            if (file.isFile()) {
              try {
                const filePath = path.join(file.path, file.name)
                const relativeFilePath = path.relative(clientDir, filePath).replace(/\\/g, '/')
                const hash = crypto.createHash('md5')
                const stream = fs.createReadStream(filePath)

                stream.on('data', (data) => hash.update(data))
                stream.on('end', () => {
                  localFiles[relativeFilePath] = {
                    size: fs.statSync(filePath).size,
                    hash: hash.digest('hex')
                  }
                  resolve()
                })
                stream.on('error', reject)
              } catch (err) {
                reject(err)
              }
            } else {
              resolve()
            }
          })
      )

      await Promise.all(tasks)
      return localFiles
    })

    ipcMain.handle('get-setting', (e, key) => {
      return store.get(key)
    })

    ipcMain.handle('set-setting', (e, key, value) => {
      store.set(key, value)
    })
  })
}

async function directoryExists(dirname) {
  try {
    await fs.promises.access(dirname)
    return true
  } catch {
    return false
  }
}

async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function isAnyClientRunning() {
  if (clientRunningLock) {
    return true
  }

  if (
    trackedClientProcess &&
    trackedClientProcess.exitCode === null &&
    !trackedClientProcess.killed
  ) {
    return true
  }

  const executables = getConfiguredClientExecutableNames()

  if (executables.length === 0) {
    return false
  }

  try {
    if (process.platform === 'win32') {
      return await isAnyWindowsProcessRunning(executables)
    }

    const { stdout } = await execFileAsync('ps', ['-A', '-o', 'comm='])
    const runningCommands = stdout
      .split(/\r?\n/)
      .map((line) => path.basename(line.trim()).toLowerCase())
      .filter(Boolean)

    return executables.some((name) => runningCommands.includes(name))
  } catch (error) {
    console.error('Failed to inspect running client processes:', error)
    return false
  }
}

async function isAnyWindowsProcessRunning(executables) {
  const targets = getConfiguredClientWindowsTargets()

  if (targets.length === 0) {
    return false
  }

  const psCommand = [
    '$targets = @(',
    targets.map((target) => `'${target.replaceAll("'", "''")}'`).join(', '),
    ')',
    '$found = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {',
    '  $_.ExecutablePath -and ($targets -contains $_.ExecutablePath.ToLowerInvariant())',
    '} | Select-Object -First 1',
    'if ($found) { "running" }'
  ].join(' ')

  const { stdout } = await execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', psCommand],
    { windowsHide: true }
  )

  return stdout.toLowerCase().includes('running')
}

function ensureClientRunningPoll() {
  if (clientRunningPoll) {
    return
  }

  let missingChecks = 0

  clientRunningPoll = setInterval(async () => {
    const hasTrackedProcess =
      trackedClientProcess && trackedClientProcess.exitCode === null && !trackedClientProcess.killed

    if (hasTrackedProcess) {
      missingChecks = 0
      return
    }

    const detected = await detectConfiguredClientProcess()
    if (detected) {
      missingChecks = 0
      clientRunningLock = true
      return
    }

    missingChecks += 1
    if (missingChecks < 3) {
      return
    }

    clientRunningLock = false
    await releaseClientLaunchLock()
    stopClientRunningPoll()
  }, 2000)
}

function stopClientRunningPoll() {
  if (!clientRunningPoll) {
    return
  }

  clearInterval(clientRunningPoll)
  clientRunningPoll = null
}

function getClientLockFilePath() {
  return join(app.getPath('userData'), 'client-launch.lock')
}

function getLauncherTokenFilePath(sessionPath) {
  return join(sessionPath, 'otclient', launcherTokenFileName)
}

async function acquireClientLaunchLock() {
  const lockFilePath = getClientLockFilePath()

  try {
    const handle = await fs.promises.open(lockFilePath, 'wx')
    await handle.writeFile(
      JSON.stringify({
        createdAt: new Date().toISOString()
      })
    )
    await handle.close()
    return true
  } catch (error) {
    if (error?.code !== 'EEXIST') {
      console.error('Failed to create client lock file:', error)
      return false
    }

    const detected = await detectConfiguredClientProcess()
    if (detected || clientRunningLock) {
      return false
    }

    await releaseClientLaunchLock()

    try {
      const handle = await fs.promises.open(lockFilePath, 'wx')
      await handle.writeFile(
        JSON.stringify({
          createdAt: new Date().toISOString()
        })
      )
      await handle.close()
      return true
    } catch (retryError) {
      if (retryError?.code !== 'EEXIST') {
        console.error('Failed to recreate client lock file:', retryError)
      }
      return false
    }
  }
}

async function releaseClientLaunchLock() {
  try {
    await fs.promises.unlink(getClientLockFilePath())
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.error('Failed to remove client lock file:', error)
    }
  }
}

async function writeLauncherToken(sessionPath) {
  await fs.promises.writeFile(getLauncherTokenFilePath(sessionPath), `${Math.floor(Date.now() / 1000)}`)
}

async function clearLauncherToken(sessionPath) {
  try {
    await fs.promises.writeFile(getLauncherTokenFilePath(sessionPath), '0')
  } catch (error) {
    console.error('Failed to clear launcher token:', error)
  }
}

async function detectConfiguredClientProcess() {
  const executables = getConfiguredClientExecutableNames()

  if (executables.length === 0) {
    return false
  }

  try {
    if (process.platform === 'win32') {
      return await isAnyWindowsProcessRunning(executables)
    }

    const { stdout } = await execFileAsync('ps', ['-A', '-o', 'comm='])
    const runningCommands = stdout
      .split(/\r?\n/)
      .map((line) => path.basename(line.trim()).toLowerCase())
      .filter(Boolean)

    return executables.some((name) => runningCommands.includes(name))
  } catch (error) {
    console.error('Failed to inspect running client processes:', error)
    return false
  }
}

function getConfiguredClientExecutableNames() {
  return [...new Set(Object.values(config.CLIENTS || {}))]
    .filter(Boolean)
    .map((name) => path.basename(name).toLowerCase())
}

function getConfiguredClientWindowsTargets() {
  const sessionPath = app.isPackaged ? app.getPath('userData') : app.getAppPath()

  return [...new Set(Object.values(config.CLIENTS || {}))]
    .filter(Boolean)
    .map((name) => join(sessionPath, 'otclient', name))
    .map((fullPath) => path.normalize(fullPath).toLowerCase())
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
