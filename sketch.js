// i refers to the horizontal position / column number
// j refers to the vertical position / row number

// Global variables
let gameGrid;
let gridNum = 5;
let gridWidth = (window.innerHeight > window.innerWidth) ? (Math.floor(window.innerWidth * 0.9 / 50) * 50) : 400;
let w = gridWidth / gridNum;
let margin = gridWidth * 0.03;
let standardBorder = { color: null, weight: margin / 3 };
let highlightedBorder = { color: 255, weight: margin / 2 };

let combineAnimationBuffer = [];
let score;
let previousScore;
let previousState, undoState;

let startX = null;
let startY = null;
let moving = false;

// Box object constructor
class Box {
  constructor(x, y, val, prev) {
    // Movement and positioning
    this.x = x * w + margin / 2;
    this.y = y * w + margin / 2;
    this.w = w - margin;
    this.moving = false;
    this.newPosition = { x: null, y: null };

    // Math
    this.val = val;
    this.prev = prev;
    this.next = val + prev;

    // a e s t h e t i c
    this.fill = (this.val <= 10946) ? boxProps[this.val].fill : "#05386b";
    this.stroke = (this.val <= 10946) ? boxProps[this.val].stroke : "#fff";
    this.fontSize = (this.val <= 10946) ? boxProps[this.val].fontSize: 16;
    this.border = standardBorder;
  }

  // Call moveTo with the new coordinates to animate movement
  moveTo(a, b) {
    if (a && this.x < a) this.x += w / 2;
    if (a && this.x > a) this.x -= w / 2;
    if (b && this.y < b) this.y += w / 2;
    if (b && this.y > b) this.y -= w / 2;
    // Update moving to false once done
    if (this.x == a && b == null) {
      this.moving = false;
      this.newPosition = { x: null, y: null };
    }
    if (a == null && this.y == b) {
      this.moving = false;
      this.newPosition = { x: null, y: null };
    }
  }
  copy() {
    return new Box((this.x - margin / 2) / w, (this.y - margin / 2) / w, this.val, this.prev);
  }
}

// Set up
function setup() {
  createCanvas(gridWidth, gridWidth);
  select("canvas").style("border", margin / 2 + "px solid #e5eed8");
  select("canvas").center("horizontal");
  // Initialise a new game grid
  gameStart();
}

// Game components
function blankGrid() {
  let newGrid = new Array(gridNum);
  for (let i = 0; i < gridNum; i ++) {
    newGrid[i] = new Array(gridNum).fill(null);
  }
  return newGrid;
}
function addBox() {
  // Check for unoccupied squares
  let unoccupied = [];
  for (let j = 0; j < gridNum; j ++) {
    for (let i = 0; i < gridNum; i ++) {
      if (!gameGrid[j][i]) {
        unoccupied.push({ x: i, y: j});
      }
    }
  }
  // Choose a random square to add a box
  if (unoccupied.length > 0) {
    let location = random(unoccupied);
    // Choose random value for the box
    let val = (random(1) > 0.3) ? 1 : 2;
    let box = new Box(location.x, location.y, val, 1);
    box.border = highlightedBorder;
    gameGrid[location.y][location.x] = box;
    if (unoccupied.length === 1) {
      previousState = copyGrid(gameGrid);
      if (gameOver()) {
        score = ":-(";
        console.log("GAME OVER");
      }
    }
  }

}

// Game logic
function gameStart() {
  gameGrid = blankGrid();
  addBox();
  addBox();
  previousState = copyGrid(gameGrid);
  undoState = copyGrid(previousState);
  score = 0;
  previousScore = 0;
}
function gameOver() {
  // Try to move in all directions and check if different
  for (let a = 1; a <= 4; a ++) {
    move(a);
    if (different()) {
      gameGrid = copyGrid(previousState);
      return false;
    }
    gameGrid = copyGrid(previousState);
  }
  return true;
}
function copyGrid(grid) {
  let tmp = blankGrid();
  for (let j = 0; j < gridNum; j ++) {
    for (let i = 0; i < gridNum; i ++) {
      if (grid[j][i]) {
        tmp[j][i] = grid[j][i].copy();
        // Reset the position of the box if it is currently moving
        tmp[j][i].moving = false;
        tmp[j][i].x = i * w + margin / 2;
        tmp[j][i].y = j * w + margin / 2;
      }
    }
  }
  return tmp;
}
function different() {
  for (let j = 0; j < gridNum; j ++) {
    for (let i = 0; i < gridNum; i ++) {
      if (gameGrid[j][i] && !previousState[j][i]) return true;
      if (!gameGrid[j][i] && previousState[j][i]) return true;
    }
  }
  return false;
}
function undo() {
  gameGrid = copyGrid(undoState);
  previousState = copyGrid(undoState);
  score = previousScore;
}

// Movement
// 1 for right; 2 for left; 3 for up; 4 for down
function slide(dir) {
  let tmpGrid = gameGrid;
  if (dir === 1) {
    // Slide right
    // Loop through each row,
    for (let j = 0; j < gridNum; j ++) {
      tmpRow = tmpGrid[j];
      // Loop through the row from the right,
      for (let i = gridNum - 1; i > 0; i --) {
        // If the current position is empty,
        if (!tmpRow[i]) {
          // Search the remaining row,
          for (let a = i - 1; a >= 0; a --) {
            // If an element exists,
            if (tmpRow[a]) {
              // Shift that element to the current position
              tmpRow[a].moving = true;
              tmpRow[a].newPosition.x = i * w + margin / 2;
              tmpRow[i] = tmpRow[a];
              tmpRow[a] = null;
              break;
            }
          }
        }
      }
      tmpGrid[j] = tmpRow;
    }
  } else if (dir === 2) {
    // Slide left
    for (let j = 0; j < gridNum; j ++) {
      tmpRow = tmpGrid[j];
      for (let i = 0; i < gridNum; i ++) {
        if (!tmpRow[i]) {
          for (let a = i + 1; a < gridNum; a ++) {
            if (tmpRow[a]) {
              tmpRow[a].moving = true;
              tmpRow[a].newPosition.x = i * w + margin / 2;
              tmpRow[i] = tmpRow[a];
              tmpRow[a] = null;
              break;
            }
          }
        }
      }
      tmpGrid[j] = tmpRow;
    }
  } else if (dir === 3) {
    // Slide up
    // Loop through each col,
    for (let i = 0; i < gridNum; i ++) {
      // Loop through the rows from the top,
      for (let j = 0; j < gridNum; j ++) {
        // If the current position is empty,
        if (!tmpGrid[j][i]) {
          // Search the remaining col,
          for (let a = j + 1; a < gridNum; a ++) {
            // If an element exists,
            if (tmpGrid[a][i]) {
              // Shift that element to the current position
              tmpGrid[a][i].moving = true;
              tmpGrid[a][i].newPosition.y = j * w + margin / 2;
              tmpGrid[j][i] = tmpGrid[a][i];
              tmpGrid[a][i] = null;
              break;
            }
          }
        }
      }
    }
  } else if (dir === 4) {
    // Slide down
    for (let i = 0; i < gridNum; i ++) {
      for (let j = gridNum - 1; j > 0; j --) {
        if (!tmpGrid[j][i]) {
          for (let a = j - 1; a >= 0; a --) {
            if (tmpGrid[a][i]) {
              tmpGrid[a][i].moving = true;
              tmpGrid[a][i].newPosition.y = j * w + margin / 2;
              tmpGrid[j][i] = tmpGrid[a][i];
              tmpGrid[a][i] = null;
              break;
            }
          }
        }
      }
    }
  }
  return tmpGrid;
}
function combine(dir) {
  let tmpGrid = gameGrid;
  if (dir === 1) {
    // Slide right
    // Loop through each row,
    for (let j = 0; j < gridNum; j ++) {
      tmpRow = tmpGrid[j];
      // Loop through the row from the right,
      for (let i = gridNum - 1; i > 0; i --) {
        let current = tmpRow[i];
        let neighbor = tmpRow[i - 1];
        // If the current position and the left position contain boxes,
        if (current && neighbor) {
          // Check if the boxes can be added,
          if (neighbor.val == current.prev || neighbor.val == current.next) {
            // Create a new box for the sum of the 2 move
            let val = current.val + neighbor.val;
            let prev = (current.val > neighbor.val) ? current.val : neighbor.val;
            let box = new Box(i, j, val, prev);
            box.border = highlightedBorder;
            tmpRow[i] = box;
            score += val;
            tmpRow[i - 1].moving = true;
            tmpRow[i - 1].newPosition.x = i * w + margin / 2;
            combineAnimationBuffer.push(tmpRow[i - 1]);
            tmpRow[i - 1] = null;
          }
        }
      }
      tmpGrid[j] = tmpRow;
    }
  } else if (dir === 2) {
    // Slide left
    for (let j = 0; j < gridNum; j ++) {
      tmpRow = tmpGrid[j];
      for (let i = 0; i < gridNum; i ++) {
        let current = tmpRow[i];
        let neighbor = tmpRow[i + 1];
        if (current && neighbor) {
          if (neighbor.val == current.prev || neighbor.val == current.next) {
            let val = current.val + neighbor.val;
            let prev = (current.val > neighbor.val) ? current.val : neighbor.val;
            let box = new Box(i, j, val, prev);
            box.border = highlightedBorder;
            tmpRow[i] = box;
            score += val;
            tmpRow[i + 1].moving = true;
            tmpRow[i + 1].newPosition.x = i * w + margin / 2;
            combineAnimationBuffer.push(tmpRow[i + 1]);
            tmpRow[i + 1] = null;
          }
        }
      }
      tmpGrid[j] = tmpRow;
    }
  } else if (dir === 3) {
    // Slide up
    // Loop through each col,
    for (let i = 0; i < gridNum; i ++) {
      // Loop through the rows from the top,
      for (let j = 0; j < gridNum - 1; j ++) {
        let current = tmpGrid[j][i];
        let neighbor = tmpGrid[j + 1][i];
        // If the current position and the lower position contain boxes,
        if (current && neighbor) {
          // Check if the boxes can be added,
          if (neighbor.val == current.prev || neighbor.val == current.next) {
            // Create a new box for the sum of the 2 move
            let val = current.val + neighbor.val;
            let prev = (current.val > neighbor.val) ? current.val : neighbor.val;
            let box = new Box(i, j, val, prev);
            box.border = highlightedBorder;
            tmpGrid[j][i] = box;
            score += val;
            tmpGrid[j + 1][i].moving = true;
            tmpGrid[j + 1][i].newPosition.y = j * w + margin / 2;
            combineAnimationBuffer.push(tmpGrid[j + 1][i]);
            tmpGrid[j + 1][i] = null;
          }
        }
      }
    }
  } else if (dir === 4) {
    // Slide down
    for (let i = 0; i < gridNum; i ++) {
      for (let j = gridNum - 1; j > 0; j --) {
        let current = tmpGrid[j][i];
        let neighbor = tmpGrid[j - 1][i];
        // If the current position and the lower position contain boxes,
        if (current && neighbor) {
          // Check if the boxes can be added,
          if (neighbor.val == current.prev || neighbor.val == current.next) {
            // Create a new box for the sum of the 2 move
            let val = current.val + neighbor.val;
            let prev = (current.val > neighbor.val) ? current.val : neighbor.val;
            let box = new Box(i, j, val, prev);
            box.border = highlightedBorder;
            tmpGrid[j][i] = box;
            score += val;
            tmpGrid[j - 1][i].moving = true;
            tmpGrid[j - 1][i].newPosition.y = j * w + margin / 2;
            combineAnimationBuffer.push(tmpGrid[j - 1][i]);
            tmpGrid[j - 1][i] = null;
          }
        }
      }
    }
  }
  return tmpGrid;
}
function move(dir) {
  previousScore = score;
  // Check if any boxes are still moving
  for (let j = 0; j < gridNum; j ++) {
    for (let i = 0; i < gridNum; i ++) {
      if (gameGrid[j][i] && gameGrid[j][i].moving) {
        return;
      }
    }
  }
  // Reset highlighted boxes
  for (let j = 0; j < gridNum; j ++) {
    for (let i = 0; i < gridNum; i ++) {
      if (gameGrid[j][i]) {
        gameGrid[j][i].border = standardBorder;
      }
    }
  }

  // Compact boxes to one side
  gameGrid = slide(dir);
  // Combine valid adjacent pairs
  gameGrid = combine(dir);
  // Compact again
  gameGrid = slide(dir);
}

// Controls
function keyPressed() {
  // Using WASD or the direction pads
  switch (keyCode) {
    // Right
    case 39:
    case 68:
      move(1);
      break;
    // Left
    case 37:
    case 65:
      move(2)
      break;
    case 38:
    case 87:
      move(3);
      break;
    case 40:
    case 83:
      move(4);
      break;
    case 90:
      undo();
      break;
  }

  // Check if the move has changed the grid
  if (different()) {
    // Store previous state
    undoState = copyGrid(previousState);
    addBox();
    previousState = copyGrid(gameGrid);
  }
}
function touchStarted(e) {
  if (!startX && !startY) {
    startX = mouseX;
    startY = mouseY;
  }
}
function touchMoved(e) {
  moving = true;
  e.preventDefault();
}
function touchEnded(e) {
  if (moving && startX && startY) {
    let horizontal = mouseX - startX;
    let vertical = mouseY - startY;
    if (Math.abs(horizontal) > Math.abs(vertical)) {
      if (horizontal > 20) {
        // Swipe right
        move(1);
      } else if (horizontal < -20){
        // Swipe left
        move(2);
      }
    } else {
      if (vertical < -20) {
        // Swipe up
        move(3);
      } else if (vertical > 20){
        // Swipe down
        move(4);
      }
    }
    if (different()) {
      undoState = copyGrid(previousState);
      addBox();
      previousState = copyGrid(gameGrid);
    }
    startX = null;
    startY = null;
    moving = false;
  }
}

// Rendering
function draw() {
  background("#f5faee");

  // Draw game grid
  noFill();
  strokeWeight(margin);
  stroke("#e5eed8");
  rect(0, 0, gridWidth, gridWidth);
  for (let i = 1; i < gridNum; i ++) {
    for (let j = 1; j < gridNum; j ++) {
      line(j * w, 0, j * w, gridWidth);
      line(0, i * w, gridWidth, i * w);
    }
  }

  // Draw boxes
  drawBoxes();
  drawCombines();

  // Update score
  select("#score").html(score);
}
function drawBoxes() {
  gameGrid.forEach(boxes => {
    boxes.forEach(box => {
      if (box) {
        // Draw each box
        fill(box.fill);
        stroke((box.border.color) ? box.border.color : box.fill);
        strokeWeight(box.border.weight);
        rect(box.x, box.y, box.w, box.w, 4);
        // Draw text
        stroke(box.stroke)
        textFont("Trebuchet MS", box.fontSize);
        textAlign(CENTER, CENTER);
        fill(255);
        noStroke();
        text(box.val, box.x + box.w / 2, box.y + box.w / 2);
        // Animate movement
        if (box.moving) {
          box.moveTo(box.newPosition.x, box.newPosition.y);
        }
      }
    });
  });
}
function drawCombines() {
  if (combineAnimationBuffer.length > 0) {
    combineAnimationBuffer.forEach((box, a) => {
      // Only draw the box if its moving
      if (box.moving) {
        fill(box.fill);
        stroke((box.border.color) ? box.border.color : box.fill);
        strokeWeight(box.border.weight);
        rect(box.x, box.y, box.w, box.w, 4);
        box.moveTo(box.newPosition.x, box.newPosition.y);
      } else {
        // Remove the box if its done moving
        combineAnimationBuffer.splice(a, 1);
      }
    });
  }
}
