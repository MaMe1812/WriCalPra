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

  addChar("+", matrix, 0, nrOperands - 1);
  addChar("=", matrix, 0, nrOperands);
  //addNumber(operands[0], matrix, 3, 0);
  return matrix;
}

function addChar(char, matrix, colIndex, rowIndex) {
  matrix[rowIndex][colIndex].displayValue = char;
}

function addNumber(number, matrix, colIndex, rowIndex) {
  var chars = number.split("");
  for (let index = 0; index < chars.length; index++) {
    addChar(chars[index], matrix, colIndex + index, nrOperands);
  }
  matrix[rowIndex][colIndex].displayValue = char;
}
