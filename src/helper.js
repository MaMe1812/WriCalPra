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
export function getOperations() {
  let operations = [];
  operations.push("+");
  operations.push("-");
  operations.push("*");
  operations.push(":");
  return operations;
}

function GetOperands(operation, level) {
  let operands = [];
  let nrOperandDigits;
  switch (operation) {
    case "+":
    case "-":
      let nrOperands = Math.floor(level / 5 + 1) * 2;
      nrOperandDigits = Math.floor(level / 2) + 1;

      for (let index = 0; index < nrOperands; index++) {
        operands.push(getRandomNumber(nrOperandDigits));
      }
      break;
    case "*":
      nrOperandDigits = Math.floor(level / 2) + 2;
      operands.push(getRandomNumber(nrOperandDigits));
      operands.push(getRandomNumber(nrOperandDigits));
    case ":":
      nrOperandDigits = Math.floor(level / 2) + 2;
      operands.push(getRandomNumber(nrOperandDigits));
      nrOperandDigits = Math.floor(level / 3) + 1;
      operands.push(getRandomNumber(nrOperandDigits));
    default:
      break;
  }

  return operands;
}

function getRandomNumber(nrOperandDigits) {
  let min = Math.pow(10, nrOperandDigits - 1);
  let max = Math.pow(10, nrOperandDigits);
  return Math.floor(Math.random() * (max - min)) + min;
}

function createCellInfoMatrix() {
  let columns = 24;
  let rows = 16;
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
  console.log(operation);
  switch (operation) {
    case "+":
      return fillCellInfosForAddition(operands, matrix);
    case "-":
      return fillCellInfosForSubstraction(operands, matrix);
    case "*":
      return fillCellInfosForMultiplication(operands, matrix);
    case ":":
      return fillCellInfosForDivision(operands, matrix);
    default:
      break;
  }
}

function fillCellInfosForDivision(operands, matrix) {
  let lenOp1 = addNumber({
    number: operands[0],
    matrix,
    rowIndex: 0,
    refColIndex: 0,
  });
  setDisplayValue(":", matrix, 0, lenOp1);
  let lenOp2 = addNumber({
    number: operands[1],
    matrix,
    rowIndex: 0,
    refColIndex: lenOp1 + 1,
  });
  setDisplayValue("=", matrix, 0, lenOp1 + lenOp2 + 1);
  fillIsTask(matrix, 1, lenOp1 + lenOp2 + 2);
  let result = Math.floor(operands[0] / operands[1]);
  let resultLen = addNumber({
    number: result,
    matrix,
    rowIndex: 0,
    refColIndex: lenOp1 + lenOp2 + 2,
    isResult: true,
  });
  setSolutionValue("R", matrix, 0, lenOp1 + lenOp2 + resultLen + 2);
  addNumber({
    number: operands[0] % operands[1],
    matrix,
    rowIndex: 0,
    refColIndex: lenOp1 + lenOp2 + resultLen + 3,
    isResult: true,
  });

  /*
  setHelpInputLine(matrix, lenOp2 + 1);
  setUnderline(matrix, lenOp2 + 1, 0, endIndex);

  setIsTask(matrix, lenOp2 + 2, 0);

  for (let index = 0; index < lenOp2; index++) {
    let digit = getDigit(operands[1], index);
    addNumber({
      number: operands[0] * digit,
      matrix,
      rowIndex: lenOp2 - index,
      refColIndex: endIndex - index,
      isResult: true,
      alignRight: true,
    });
  }*/
  return matrix;
}

function fillCellInfosForMultiplication(operands, matrix) {
  let lenOp1 = addNumber({
    number: operands[0],
    matrix,
    rowIndex: 0,
    refColIndex: 0,
  });
  setDisplayValue("*", matrix, 0, lenOp1);
  let lenOp2 = addNumber({
    number: operands[1],
    matrix,
    rowIndex: 0,
    refColIndex: lenOp1 + 1,
  });
  let endIndex = lenOp2 + lenOp1 + 1;
  fillIsTask(matrix, 1, endIndex + 2);

  setHelpInputLine(matrix, lenOp2 + 1);
  setUnderline(matrix, lenOp2 + 1, 0, endIndex);

  setDisplayValue("=", matrix, lenOp2 + 2, 0);
  setIsTask(matrix, lenOp2 + 2, 0);
  addNumber({
    number: operands[0] * operands[1],
    matrix,
    rowIndex: lenOp2 + 2,
    refColIndex: endIndex,
    isResult: true,
    alignRight: true,
  });

  for (let index = 0; index < lenOp2; index++) {
    let digit = getDigit(operands[1], index);
    addNumber({
      number: operands[0] * digit,
      matrix,
      rowIndex: lenOp2 - index,
      refColIndex: endIndex - index,
      isResult: true,
      alignRight: true,
    });
  }
  return matrix;
}
function getDigit(number, digitIndex) {
  var div = Math.pow(10, digitIndex + 1);
  var rem = number % div;
  return Math.floor(rem / Math.pow(10, digitIndex));
}

function fillCellInfosForSubstraction(operands, matrix) {
  let nrOperands = operands.length;
  setDisplayValue("=", matrix, nrOperands + 1, 0);
  setIsTask(matrix, nrOperands + 1, 0);
  const sum = (accumulator, currentValue) => accumulator + currentValue;
  let result = operands.reduce(sum);
  var endIndex = addNumber({
    number: result,
    matrix,
    rowIndex: 0,
    refColIndex: 1,
  });
  fillIsTask(matrix, nrOperands, endIndex + 2);
  for (let index = 0; index < operands.length - 1; index++) {
    const operand = operands[index];
    addNumber({
      number: operand,
      matrix,
      rowIndex: index + 1,
      refColIndex: endIndex + 1,
      alignRight: true,
    });
  }
  for (let index = 1; index < operands.length; index++) {
    setDisplayValue("-", matrix, index, 0);
  }

  var endIndex = addNumber({
    number: operands[operands.length - 1],
    matrix,
    rowIndex: operands.length + 1,
    refColIndex: endIndex + 1,
    isResult: true,
    alignRight: true,
  });

  setHelpInputLine(matrix, nrOperands);
  setUnderline(matrix, nrOperands, 0, endIndex + 1);
  return matrix;
}

function fillCellInfosForAddition(operands, matrix) {
  let nrOperands = operands.length;
  setDisplayValue("=", matrix, nrOperands + 1, 0);
  setIsTask(matrix, nrOperands + 1, 0);
  const sum = (accumulator, currentValue) => accumulator + currentValue;
  let result = operands.reduce(sum);
  var endIndex = addNumber({
    number: result,
    matrix,
    rowIndex: nrOperands + 1,
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
  for (let index = 1; index < operands.length; index++) {
    setDisplayValue("+", matrix, index, 0);
  }
  setHelpInputLine(matrix, nrOperands);
  setUnderline(matrix, nrOperands, 0, endIndex);
  return matrix;
}

function setHelpInputLine(matrix, rowIndex) {
  matrix[rowIndex].forEach((element) => {
    element.helpInput = true;
  });
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
