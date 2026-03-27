<script>
  export let className = ''
  export let style = ''
  export let label = 'Button'
  export let disabled = false
  export let onClick = () => {}
</script>

<button class={className} {style} {disabled} on:click={onClick}>
  {label}
</button>

<style>
  button {
    height: 36px;
    padding: 0 24px;
    border-radius: var(--radius);
    background: linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(46 50% 35%) 100%);
    color: hsl(var(--accent-foreground));
    border: 1px solid rgba(255,255,255,0.1);
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    display: inline-flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    outline: none;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
  }

  button:hover:not(:disabled) {
    background: linear-gradient(135deg, hsl(46 70% 60%) 0%, hsl(46 55% 42%) 100%);
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(212, 175, 55, 0.3), 0 4px 6px -2px rgba(212, 175, 55, 0.1);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
    opacity: 0.9;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: hsl(var(--muted));
    color: hsl(var(--muted-foreground));
  }

  /* Optional: Variant classes can be handled via className prop if needed, 
     but this sets a solid default 'Primary' look */
</style>
