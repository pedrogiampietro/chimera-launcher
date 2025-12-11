<script>
  import { onMount } from 'svelte'
  import Button from './Button.svelte'
  import CheckBox from './CheckBox.svelte'

  let isOpen = false
  let autoPlay = false
  let closeOnLaunch = false

  onMount(async () => {
    autoPlay = await window.api.getSetting('autoPlay')
    closeOnLaunch = await window.api.getSetting('closeOnLaunch')
  })
</script>

<Button className="settings-button" label="Settings" onClick={() => (isOpen = !isOpen)} />

{#if isOpen}
  <div class="settings-modal glass-card">
    <div class="title">Settings</div>
    <div class="content custom-scrollbar">
      <CheckBox
        bind:checked={autoPlay}
        label="Auto Play"
        onChange={() => {
          window.api.setSetting('autoPlay', autoPlay)
        }}
      />
      <CheckBox
        bind:checked={closeOnLaunch}
        disabled={autoPlay}
        label="Close on Launch"
        onChange={() => {
          window.api.setSetting('closeOnLaunch', closeOnLaunch)
        }}
      />
    </div>
    <div class="footer">
        <Button onClick={() => (isOpen = false)} label="Close" />
    </div>
  </div>
{/if}

<style>
  :global(.settings-button) {
    font-size: 14px;
    background: transparent !important;
    border: none !important;
    color: hsl(var(--muted-foreground)) !important;
    box-shadow: none !important;
  }
  :global(.settings-button:hover) {
    color: hsl(var(--foreground)) !important;
    background: hsl(var(--secondary) / 0.5) !important;
  }

  .settings-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;

    display: flex;
    flex-direction: column;
    width: 280px;
    padding-bottom: 16px;
    overflow: hidden;
  }

  .title {
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    text-align: left;
    border-bottom: 1px solid hsl(var(--border) / 0.5);
    background: hsl(var(--secondary) / 0.5);
    margin-bottom: 16px;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 16px;
    margin-bottom: 16px;
  }
  
  .footer {
      padding: 0 16px;
      display: flex;
      justify-content: flex-end;
  }
</style>
