<script>
  import Logo from './components/Logo.svelte'
  import Socials from './components/Socials.svelte'
  import NewsPanel from './components/NewsPanel.svelte'
  import Updater from './components/Updater.svelte'
  import TopButtons from './components/TopButtons.svelte'
</script>

<Logo />
<div class="container">
  <TopButtons />
  <Socials />
  <NewsPanel />
  <Updater />
</div>

<style>
  :global(body) {
    background-color: hsl(var(--background));
    background-image: url('./assets/images/background.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }
  
  .container {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 24px;
    height: calc(100vh - var(--logo-height) + var(--logo-margin));
    gap: 1rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    z-index: 1; /* Ensure content is above background */
  }
</style>
