<script>
  import { onMount } from 'svelte'
  import NewsEntry from './NewsEntry.svelte'

  let news = []
  let loading = true

  onMount(async () => {
    try {
      const url = await window.api.getConfig('API_URL')
      const response = await fetch(`${url}/launcher/news`)
      if (!response.ok) throw new Error('Failed to fetch news')

      news = await response.json()
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      loading = false
    }
  })
</script>

<div class="news-panel glass-card">
  <div class="title">News</div>
  <div class="content custom-scrollbar">
    {#if loading}
      <div class="p-4 text-center text-muted">Loading...</div>
    {:else if news.length === 0}
      <div class="p-4 text-center text-muted">No news available.</div>
    {:else}
      {#each news as entry (entry.link)}
        <NewsEntry type={entry.type} title={entry.title} date={entry.date} link={entry.link} />
      {/each}
    {/if}
  </div>
</div>

<style>
  .news-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .title {
    padding: 12px;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid hsl(var(--border) / 0.5);
    background: linear-gradient(to right, hsl(var(--secondary) / 0.8), hsl(var(--secondary) / 0.4));
    color: hsl(var(--foreground));
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
  }
</style>
