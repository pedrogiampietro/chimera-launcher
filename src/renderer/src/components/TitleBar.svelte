<script>
  import SettingsButton from './SettingsButton.svelte'
  import { onMount } from 'svelte'

  let version = '1.0.0'

  onMount(async () => {
      // You might want to fetch version dynamically if available via IPC
  })

  function minimize() {
    window.api.minimize()
  }

  function close() {
    window.api.close()
  }
</script>

<div class="title-bar">
  <div class="app-region-drag">
      <span class="version">Chimera Launcher</span>
  </div>
  <div class="controls">
    <div class="settings-wrapper">
        <SettingsButton />
    </div>
    <button class="control-btn min" on:click={minimize}>
        <svg width="10" height="1" viewBox="0 0 10 1" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="10" height="1" fill="currentColor"/>
        </svg>
    </button>
    <button class="control-btn close" on:click={close}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>            
    </button>
  </div>
</div>

<style>
  .title-bar {
    height: 32px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: transparent;
    z-index: 50;
    flex-shrink: 0;
  }

  .app-region-drag {
    flex-grow: 1;
    height: 100%;
    display: flex;
    align-items: center;
    padding-left: 16px;
    -webkit-app-region: drag;
    user-select: none;
  }
  
  .version {
      font-size: 12px;
      color: hsl(var(--muted-foreground));
      font-weight: 500;
  }

  .controls {
    display: flex;
    align-items: center;
    height: 100%;
    -webkit-app-region: no-drag;
  }
  
  .settings-wrapper {
      margin-right: 8px;
  }

  .control-btn {
    height: 32px;
    width: 46px;
    background: transparent;
    border: none;
    color: hsl(var(--muted-foreground));
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
    outline: none;
  }

  .control-btn:hover {
    background: hsl(var(--secondary) / 0.5);
    color: hsl(var(--foreground));
  }

  .control-btn.close:hover {
    background: #e11d48; /* Red-600 */
    color: white;
  }
</style>
