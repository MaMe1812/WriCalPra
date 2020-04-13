export function getCellInfos(operation, level) {
  // 34*2=68
  let operands = [123, 456];
  return fillCellInfoMatrix(operation, operands);

  let cellInfos = [
    [
      { task: true },
      { displayValue: "3", task: true },
      { displayValue: "4", task: true },
      { displayValue: "*", task: true },
      { displayValue: "2", task: true },
      { displayValue: "=", task: true },
      { displayValue: " ", solutionValue: "6" },
      { displayValue: " ", solutionValue: "8" },
      { displayValue: " " },
      { displayValue: " " },
    ],

    [
      { task: true },
      { displayValue: "3", task: true },
      { displayValue: "4", task: true },
      { displayValue: "*", task: true },
      { displayValue: "2", task: true },
      { displayValue: "=", task: true },
      { displayValue: " ", solutionValue: "6" },
      { displayValue: " ", solutionValue: "8" },
      { displayValue: " " },
      { displayValue: " " },
    ],
  ];
  console.log("test");
  return cellInfos;
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
  addNumber(result, matrix, nrOperands, 1, true);
  addNumber(operands[0], matrix, 0, 1);
  addNumber(operands[1], matrix, 1, 1);

  return matrix;
}

function setDisplayValue(char, matrix, rowIndex, colIndex) {
  matrix[rowIndex][colIndex].displayValue = char;
}

function setSolutionValue(char, matrix, rowIndex, colIndex) {
  matrix[rowIndex][colIndex].solutionValue = char;
}

function addNumber(number, matrix, rowIndex, colIndex, isResult = false) {
  var chars = number.toString().split("");
  for (let index = 0; index < chars.length; index++) {
    if (isResult) {
      setSolutionValue(chars[index], matrix, rowIndex, colIndex + index);
    } else {
      setDisplayValue(chars[index], matrix, rowIndex, colIndex + index);
    }
  }
}
