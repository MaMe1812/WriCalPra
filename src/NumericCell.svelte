<script>
  import { showSolution } from "./stores.js";
  import { showHints } from "./stores.js";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let showSolution_value;

  const unsubscribe = showSolution.subscribe(value => {
    showSolution_value = value;
  });

  let showHints_value;

  const unsubscribe1 = showHints.subscribe(value => {
    showHints_value = value;
  });

  export let item;
  export let row;
  export let ref = null;
  export let callback;
  $: displayValue =
    showSolution_value && item.solutionValue
      ? item.solutionValue
      : item.displayValue;

  const callCallback = event => {
    if (item.task) {
      return;
    }
    if (
      (event.keyCode >= 48 && event.keyCode <= 90) ||
      (event.keyCode >= 96 && event.keyCode <= 105)
    ) {
      item.displayValue = event.key;
    }
    if (event.keyCode === 8) {
      item.displayValue = " ";
    }
    callback(item, row, event.keyCode);
  };

  $: inputClass = item.helpInput
    ? "helpInput"
    : showHints_value && item.solutionValue
    ? item.displayValue === item.solutionValue
      ? "showHints_good"
      : "showHints_false"
    : "";
</script>

<style>
  input[type="text"] {
    border: solid lightgray 1px;
    width: 15px;
    padding: 1px;
    margin: 0px;
    display: block;
  }

  .underline {
    border-bottom: 1px solid black;
  }

  .showHints_false {
    background-color: rgba(200, 0, 0, 0.2);
  }

  .showHints_good {
    background-color: rgba(0, 200, 0, 0.2);
  }

  .helpInput {
    background-color: rgba(0, 0, 20, 0.02);
    font: 0.6em sans-serif;
    text-align: center;
  }
  .helpDiv {
    height: 15px;
  }
</style>

<div class:underline={item.underline} class:helpDiv={item.helpInput}>
  <input
    readonly={item.task}
    bind:this={ref}
    bind:value={displayValue}
    on:keydown={callCallback}
    type="text"
    maxlength="1"
    class={inputClass} />
</div>
