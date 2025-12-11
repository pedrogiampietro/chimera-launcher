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
    <Logo />
    <Socials />
    <NewsPanel />
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
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    overflow-y: auto; /* Allow scrolling if content is too tall */
    z-index: 1;
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
