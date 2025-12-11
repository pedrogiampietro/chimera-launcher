<script>
  export let type = ''
  export let title = ''
  export let date = ''
  export let link = '#'

  let expanded = false

  function toggleExpand() {
    expanded = !expanded
  }

  function openLink() {
    window.api.openExternal(link)
  }
</script>

<div class="news-entry" class:expanded>
  <div class="header" on:click={toggleExpand} role="button" tabindex="0" on:keypress={toggleExpand}>
    <span class="type">{type}</span>
    <span class="title" class:truncated={!expanded}>{title}</span>
    <span class="date">{date}</span>
    <span class="expand-icon">{expanded ? '▲' : '▼'}</span>
  </div>
  {#if expanded}
    <div class="details">
      <p class="full-title">{title}</p>
      <button class="read-more" on:click={openLink}>Ler mais no Discord</button>
    </div>
  {/if}
</div>

<style>
  .news-entry {
    background: linear-gradient(90deg, #00000066, #00000000);
    margin-bottom: 4px;
    border-radius: 4px;
    overflow: hidden;
  }

  .news-entry:hover {
    background: linear-gradient(90deg, #ffffff11, #ffffff00);
  }

  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 8px;
    cursor: pointer;
    gap: 8px;
  }

  .type {
    color: #888888;
    font-size: 12px;
    flex-shrink: 0;
  }

  .title {
    color: #ffffff;
    flex-grow: 1;
    min-width: 0;
  }

  .title.truncated {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .date {
    color: #888888;
    font-size: 12px;
    flex-shrink: 0;
  }

  .expand-icon {
    color: #888888;
    font-size: 10px;
    flex-shrink: 0;
  }

  .details {
    padding: 8px 12px 12px;
    border-top: 1px solid #ffffff11;
  }

  .full-title {
    color: #cccccc;
    margin: 0 0 12px 0;
    font-size: 13px;
    line-height: 1.4;
  }

  .read-more {
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: opacity 0.2s;
  }

  .read-more:hover {
    opacity: 0.9;
  }
</style>
