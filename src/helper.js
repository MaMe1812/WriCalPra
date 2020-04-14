export function getCellInfos(operation, level) {
  let operands = GetOperands(operation, level); //[123, 456, 9500];
  return fillCellInfoMatrix(operation, operands);
}
export function getLevels() {
  let levels = [];
  for (let index = 0; index < 10; index++) {
    levels.push({ id: index + 1, text: `Level ${index + 1}` });
  }
  return levels;
}

function GetOperands(operation, level) {
  // addition
  let nrOperands = Math.floor(level / 5 + 1) * 2;
  let nrOperandDigits = Math.floor(level / 2) + 1;
  let operands = [];
  for (let index = 0; index < nrOperands; index++) {
    operands.push(getRandomNumber(nrOperandDigits));
  }

  return operands;
}

function getRandomNumber(nrOperandDigits) {
  let min = 0;
  let max = Math.pow(10, nrOperandDigits);
  return Math.floor(Math.random() * (max - min)) + min;
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
  setIsTask(matrix, nrOperands, 0);
  const sum = (accumulator, currentValue) => accumulator + currentValue;
  let result = operands.reduce(sum);
  var endIndex = addNumber({
    number: result,
    matrix,
    rowIndex: nrOperands,
    refColIndex: 1,
    isResult: true,
  });
  fillIsTask(matrix, nrOperands, endIndex + 2);

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
  setUnderline(matrix, nrOperands - 1, 0, endIndex);

  return matrix;
}

function setUnderline(matrix, rowIndex, startColIndex, endColIndex) {
  for (let colIndex = startColIndex; colIndex <= endColIndex; colIndex++) {
    matrix[rowIndex][colIndex].underline = true;
  }
}

function setDisplayValue(char, matrix, rowIndex, colIndex) {
  matrix[rowIndex][colIndex].displayValue = char;
}

function setIsTask(matrix, rowIndex, colIndex) {
  matrix[rowIndex][colIndex].task = true;
}

function setSolutionValue(char, matrix, rowIndex, colIndex) {
  matrix[rowIndex][colIndex].solutionValue = char;
}

function fillIsTask(matrix, nrRows, nrCols) {
  for (let rowIndex = 0; rowIndex < nrRows; rowIndex++) {
    for (let colIndex = 0; colIndex < nrCols; colIndex++) {
      setIsTask(matrix, rowIndex, colIndex);
    }
  }
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
