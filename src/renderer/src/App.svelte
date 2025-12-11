<script>
  import Logo from './components/Logo.svelte'
  import Socials from './components/Socials.svelte'
  import NewsPanel from './components/NewsPanel.svelte'
  import Updater from './components/Updater.svelte'
  import TitleBar from './components/TitleBar.svelte'
</script>

<div class="window-frame">
  <TitleBar />
  <div class="content-container">
    <div class="top-section">
      <Logo />
      <NewsPanel />
    </div>
    <Socials />
    <Updater />
  </div>
</div>

<style>
  :global(body) {
    background-color: hsl(var(--background));
    background-image: url('./assets/images/background.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    margin: 0;
    overflow: hidden; /* Prevent body scroll, handle inside if needed */
  }

  /* Main wrapper that defines the window border/frame */
  .window-frame {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    border: 1px solid hsl(var(--border));
    background: transparent;
    box-sizing: border-box;
    overflow: hidden;
  }
  
  .content-container {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    padding: 0 32px 32px 32px;
    gap: 1rem;
    width: 100%;
    box-sizing: border-box;
    overflow-y: auto;
    z-index: 1;
  }

  .top-section {
    display: flex;
    flex-direction: row;
    gap: 1.5rem;
    align-items: flex-start;
    flex: 1;
    min-height: 0;
    width: 100%;
  }

  /* Custom Scrollbar for the main content area if needed */
  .content-container::-webkit-scrollbar {
    width: 6px;
  }
  .content-container::-webkit-scrollbar-track {
    background: transparent;
  }
  .content-container::-webkit-scrollbar-thumb {
    background: hsl(var(--muted));
    border-radius: 3px;
  }
</style>
