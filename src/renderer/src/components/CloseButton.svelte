<script>
  import Button from './Button.svelte'
</script>

<Button className="close-button" label="X" onClick={() => window.api.close()} />

<style>
  :global(.close-button) {
    font-size: 14px;
    background: transparent !important;
    border: none !important;
    color: hsl(var(--muted-foreground)) !important;
    box-shadow: none !important;
  }
  :global(.close-button:hover) {
    color: hsl(var(--destructive)) !important;
    background: hsl(var(--destructive) / 0.1) !important;
  }
</style>
