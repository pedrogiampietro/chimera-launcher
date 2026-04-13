<script>
  import { onMount, onDestroy } from 'svelte'
  import { writable, get } from 'svelte/store'
  import { DownloadPool } from '../pool.js'
  import Button from './Button.svelte'
  import ClientSelector from './ClientSelector.svelte'

  const latestFileProgress = writable(0)
  const latestFileLabel = writable('')
  const totalDownloadedBytes = writable(0)
  const totalWrittenBytes = writable(0)
  const totalWrittenFiles = writable(0)
  const queueStatus = writable({ inflight: 0, remaining: 0 })
  const downloadSpeed = writable(0)

  let R2_CDN_URL = ''
  let totalBytesToDownload = 0
  let totalFilesToWrite = 0
  let speedInterval = null
  let gameStateInterval = null
  let downloadFinished = false
  let isGameRunning = false
  let isLaunchingGame = false
  let playStatusMessage = ''

  const pool = new DownloadPool({
    concurrency: Math.min(6, navigator.hardwareConcurrency),

    onFileProgress: ({ path, received, contentLength }) => {
      latestFileLabel.set(`Downloading ${path}`)
      if (contentLength > 0) {
        latestFileProgress.set(received / contentLength)
      } else {
        latestFileProgress.set(0)
      }
    },

    onAnyProgress: ({ downloadedBytes: d }) => {
      totalDownloadedBytes.set(d)
    },

    onFileWritten: ({ totalBytes: t }) => {
      totalWrittenBytes.set(t)
      totalWrittenFiles.update((n) => n + 1)
      checkIfFinished()
    },

    onDrain: ({ remaining, inflight }) => {
      queueStatus.set({ remaining, inflight })
    },

    onFinish: () => {
      if (speedInterval) {
        clearInterval(speedInterval)
        downloadSpeed.set(0)
      }
    }
  })

  async function autoPlayIfNeeded() {
    const autoPlay = await window.api.getSetting('autoPlay')
    if (autoPlay) {
      await startGame()
    }
  }

  async function refreshGameState() {
    try {
      const gameState = await window.api.getGameState()
      isGameRunning = gameState.running
    } catch (error) {
      console.error('Error checking client state:', error)
    }
  }

  async function startGame() {
    if (isLaunchingGame) return

    isLaunchingGame = true
    playStatusMessage = ''

    try {
      const result = await window.api.startGame()

      if (result?.ok) {
        isGameRunning = true
        return
      }

      if (result?.reason === 'already-running' || result?.reason === 'launching') {
        isGameRunning = true
        playStatusMessage = 'Ja existe um cliente aberto neste computador.'
        return
      }

      if (result?.reason === 'missing-executable') {
        playStatusMessage = 'Executavel do cliente nao encontrado.'
        return
      }

      playStatusMessage = 'Nao foi possivel iniciar o cliente.'
    } catch (error) {
      console.error('Error starting client:', error)
      playStatusMessage = 'Nao foi possivel iniciar o cliente.'
    } finally {
      isLaunchingGame = false
      await refreshGameState()
    }
  }

  function checkIfFinished() {
    if (downloadFinished) return

    if (
      get(totalWrittenBytes) >= totalBytesToDownload &&
      get(totalDownloadedBytes) >= totalBytesToDownload
    ) {
      downloadFinished = true
      stopSpeedTracker()
      latestFileLabel.set('Client is up to date')
      pool.stop()
      autoPlayIfNeeded()
    }
  }

  function startSpeedTracker() {
    let lastBytes = 0
    let lastTime = performance.now()

    if (speedInterval) clearInterval(speedInterval)

    speedInterval = setInterval(() => {
      const now = performance.now()
      const bytesNow = get(totalDownloadedBytes)
      const deltaBytes = bytesNow - lastBytes
      const deltaTime = (now - lastTime) / 1000

      if (deltaTime > 0) {
        const speed = deltaBytes / deltaTime
        downloadSpeed.set(speed)
      }

      lastBytes = bytesNow
      lastTime = now
    }, 500)
  }

  function stopSpeedTracker() {
    if (speedInterval) {
      clearInterval(speedInterval)
      speedInterval = null
      downloadSpeed.set(0)
    }
  }

  function startDownloads(manifest, clientFiles) {
    let needsUpdate = false
    Object.entries(manifest).forEach(([path, info]) => {
      const localFile = clientFiles[path]
      if (!localFile || localFile.hash !== info.hash) {
        pool.enqueue(`${R2_CDN_URL}/${path}?hash=${info.hash}`, path)
        needsUpdate = true

        totalBytesToDownload += info.size
        totalFilesToWrite++
      }
    })

    if (!needsUpdate) {
      downloadFinished = true
      totalFilesToWrite = 1
      latestFileLabel.set('Client is up to date')
      totalDownloadedBytes.set(totalBytesToDownload)
      totalWrittenBytes.set(totalBytesToDownload)
      totalWrittenFiles.set(1)
      latestFileProgress.set(1)

      autoPlayIfNeeded()
      return
    }

    pool.start()

    startSpeedTracker()
  }

  function formatBytes(bytes, decimals = 1) {
    if (!bytes) return '0 B'
    const base = 1024
    const dm = decimals < 0 ? 0 : decimals
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(base))
    const formattedSize = (bytes / Math.pow(base, unitIndex)).toFixed(dm)
    return `${parseFloat(formattedSize)} ${units[unitIndex]}`
  }

  onMount(async () => {
    try {
      await refreshGameState()
      gameStateInterval = setInterval(refreshGameState, 2000)

      R2_CDN_URL = await window.api.getConfig('R2_CDN_URL')

      const manifestRes = await fetch(`${R2_CDN_URL}/manifest.json`, { cache: 'no-store' })
      if (!manifestRes.ok) throw new Error('Failed to fetch manifest')
      const manifest = await manifestRes.json()

      await window.api.cleanClient(manifest)

      const clientFiles = await window.api.readClientFiles()

      startDownloads(manifest, clientFiles)
    } catch (err) {
      console.error('Error fetching files:', err)
    }
  })

  onDestroy(() => {
    stopSpeedTracker()

    if (gameStateInterval) {
      clearInterval(gameStateInterval)
      gameStateInterval = null
    }
  })

  function getBytesProgress() {
    const downloaded = $totalDownloadedBytes
    if (totalBytesToDownload === 0) return 0
    return ((downloaded / totalBytesToDownload) * 100).toFixed(1)
  }

  function getFilesProgress() {
    const written = $totalWrittenFiles
    if (totalFilesToWrite === 0) return 0
    return ((written / totalFilesToWrite) * 100).toFixed(1)
  }
</script>

<div class="updater">
  <div class="progress-info">
    <div class="labels">
      <h1>File Progress</h1>
      <span>{formatBytes($downloadSpeed)}/s</span>
    </div>
    <progress class="bar file" value={$latestFileProgress * 100} max="100"></progress>
    <div class="labels">
      <h1>Total Progress</h1>
      <span
        >{formatBytes($totalDownloadedBytes)} of {formatBytes(totalBytesToDownload)} ({getBytesProgress()}%)</span
      >
    </div>
    <progress class="bar total" value={getFilesProgress()} max="100"></progress>
    <div class="file">{$latestFileLabel}</div>
  </div>
  <div class="play">
    <ClientSelector />
    <Button
      style="height:100%;font-size: 32px;"
      label={isGameRunning ? 'Running' : isLaunchingGame ? 'Starting' : 'Play'}
      disabled={!downloadFinished || isGameRunning || isLaunchingGame}
      onClick={startGame}
    />
    {#if playStatusMessage}
      <div class="play-status">{playStatusMessage}</div>
    {/if}
  </div>
</div>

<style>
  .updater {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-top: 10px;
    gap: 15px;
  }

  .progress-info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 8px;
  }

  .labels {
    display: flex;
    flex-direction: row;
    align-items: center;

    & h1 {
      flex-grow: 1;
      margin: 0;
    }

    & span {
      font-size: 10px;
      color: hsl(var(--muted-foreground));
      font-weight: 500;
    }
  }

  .file {
    color: hsl(var(--muted-foreground));
    font-size: 11px;
    min-height: 16px;
  }

  .bar {
    width: 100%;
    height: 3px;

    -webkit-appearance: none;
    appearance: none;

    border: 0;
  }

  progress.file::-webkit-progress-value {
    background: linear-gradient(90deg, hsl(46 65% 52%), hsl(46 50% 40%));
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
    border-radius: 4px;
  }

  progress.total::-webkit-progress-value {
    background: linear-gradient(90deg, hsl(177 43% 30%), hsl(177 43% 18%));
    box-shadow: 0 0 10px rgba(31, 78, 76, 0.6);
    border-radius: 4px;
  }

  progress::-webkit-progress-bar {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .play {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .play-status {
    max-width: 180px;
    color: hsl(var(--muted-foreground));
    font-size: 11px;
    line-height: 1.4;
    text-align: center;
  }
</style>
