export function getCellInfos(operation, level) {
  let operands = [123, 456, 9500];
  return fillCellInfoMatrix(operation, operands);
}

function createCellInfoMatrix() {
  let columns = 10;
  let rows = 8;
  let matrix = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    let row = [];
    for (let colIndex = 0; colIndex < columns; colIndex++) {
      row.push({ displayValue: " " });
    }
    matrix.push(row);
  }
  return matrix;
}
function fillCellInfoMatrix(operation, operands) {
  let matrix = createCellInfoMatrix();

  // addition
  let nrOperands = operands.length;

  setDisplayValue("+", matrix, nrOperands - 1, 0);
  setDisplayValue("=", matrix, nrOperands, 0);
  const sum = (accumulator, currentValue) => accumulator + currentValue;
  let result = operands.reduce(sum);
  var endIndex = addNumber({
    number: result,
    matrix,
    rowIndex: nrOperands,
    refColIndex: 1,
    isResult: true,
  });
  for (let index = 0; index < operands.length; index++) {
    const operand = operands[index];
    addNumber({
      number: operand,
      matrix,
      rowIndex: index,
      refColIndex: endIndex + 1,
      alignRight: true,
    });
  }

  return matrix;
}

function setDisplayValue(char, matrix, rowIndex, colIndex) {
  matrix[rowIndex][colIndex].displayValue = char;
}

function setSolutionValue(char, matrix, rowIndex, colIndex) {
  matrix[rowIndex][colIndex].solutionValue = char;
}

function addNumber({
  number,
  matrix,
  rowIndex,
  refColIndex,
  isResult,
  alignRight,
}) {
  var chars = number.toString().split("");
  for (var index = 0; index < chars.length; index++) {
    let colIndex = refColIndex + index;
    if (alignRight) colIndex -= chars.length;

    if (isResult) {
      setSolutionValue(chars[index], matrix, rowIndex, colIndex);
    } else {
      setDisplayValue(chars[index], matrix, rowIndex, colIndex);
    }
  }
  return index;
}
