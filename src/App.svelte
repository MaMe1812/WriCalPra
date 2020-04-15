<script>
  import { showSolution } from "./stores.js";
  import { showHints } from "./stores.js";
  import NumericCell from "./NumericCell.svelte";
  import { getCellInfos, getLevels, getOperations } from "./helper.js";

  let selectedOperation = "-";
  let operations = getOperations();
  let selectedLevel = 5;
  let levels = getLevels();
  let cellInfos = getCellInfos(selectedOperation, selectedLevel);

  let lastAddedCell;
  let showSolution_value;

  const unsubscribe0 = showSolution.subscribe(value => {
    showSolution_value = value;
  });

  let showHints_value;

  const unsubscribe1 = showHints.subscribe(value => {
    showHints_value = value;
  });

  const callback = (item, row, keyCode) => {
    var rowIndex = cellInfos.indexOf(row);
    var cellIndex = cellInfos[rowIndex].indexOf(item);
    switch (keyCode) {
      case 8:
      case 37:
        cellIndex--; // left
        break;
      case 38:
        rowIndex--; // up
        break;
      case 40: // down
        rowIndex++;
        break;
      case 39:
        cellIndex++;
        break;
      default:
    }

    var next = cellInfos[rowIndex][cellIndex];
    next.cellInput.focus();
  };
</script>

<style>
  button {
    margin-top: 10px;
  }
  td {
    margin: 0;
    padding: 0;
  }
</style>

<table cellspacing="0">
  {#each cellInfos as row}
    <tr>
      {#each row as cellInfo (cellInfo)}
        <td>
          <NumericCell
            item={cellInfo}
            {row}
            {callback}
            bind:ref={cellInfo.cellInput} />
        </td>
      {/each}
    </tr>
  {/each}
</table>

<button on:click={() => showSolution.update(n => !n)}>
  {showSolution_value ? 'Hide solution' : 'Show solution'}
</button>
<button on:click={() => showHints.update(n => !n)}>
  {showHints_value ? 'Hide hints' : 'Show hints'}
</button>
<br />
<select bind:value={selectedOperation}>
  {#each operations as operation}
    <option value={operation}>{operation}</option>
  {/each}
</select>
<select bind:value={selectedLevel}>
  {#each levels as level}
    <option value={level.id}>{level.text}</option>
  {/each}
</select>
<button
  on:click={() => (cellInfos = getCellInfos(selectedOperation, selectedLevel))}>
  New task
</button>
