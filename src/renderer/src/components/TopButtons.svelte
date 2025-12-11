<script>
  import CloseButton from './CloseButton.svelte'
  import SettingsButton from './SettingsButton.svelte'
</script>

<div>
  <SettingsButton />
  <CloseButton />
</div>

<style>
  div {
    position: absolute;
    right: 0;
    top: calc(var(--logo-margin) + 10px);
  }
</style>
