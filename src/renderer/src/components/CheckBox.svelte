<script>
  export let checked = false
  export let label = ''
  export let disabled = false
  export let onChange = null
</script>

<div>
  <label>
    <input type="checkbox" bind:checked on:change={onChange} {disabled} />
    <span class:disabled>{label}</span>
  </label>
</div>

<style>
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    font-size: 13px;
    color: hsl(var(--foreground));
  }

  input[type='checkbox'] {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--background));
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    display: grid;
    place-content: center;
  }

  input[type='checkbox']:checked {
    background: hsl(var(--primary));
    border-color: hsl(var(--primary));
  }

  input[type='checkbox']:checked::before {
    content: "";
    width: 10px;
    height: 10px;
    background-color: hsl(var(--primary-foreground));
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E") no-repeat center;
    mask-size: contain;
    -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E") no-repeat center;
    -webkit-mask-size: contain;
  }

  input[type='checkbox']:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .disabled {
    opacity: 0.5;
  }
</style>
