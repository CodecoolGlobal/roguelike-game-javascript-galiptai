'use strict';
/**
 * Unchangable configuration variables
 */
const c = Object.freeze({
  emptySpace: '.',
  wall: '#',
  enemy: 'X',
  gateHorizontal: '"',
  gateVertical: '=',
  boardWidth: 80,
  boardHeight: 24,
});

/**
 * The state of the current game
 */
let GAME = {
  currentRoom: '',
  board: [],
  map: {},
  player: {},
};

/**
 * Create a new player Object
 *
 * @param {string} name name of the player
 * @param {string} race race of the player
 * @returns
 */
function initPlayer(name, race) {
  return {
    x: 15,
    y: 15,
    name: name,
    icon: '@',
    race: race,
    health: 100,
    attack: 1,
    defense: 1,
    isPlayer: true,
    inventory: {},
  };
}

/**
 * List of the 4 main directions
 */
const DIRECTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/**
 * Enum for the rooms
 */
const ROOM = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
};

/**
 * Icon of the enemies
 */
const ENEMY = {
  // RAT: "r",
};

/**
 * Info of the enemies
 */
const ENEMY_INFO = {
  // [ENEMY.RAT]: { health: 10, attack: 1, defense: 0, icon: ENEMY.RAT, race: "Rat", isBoss: false },
};

const ITEMS = {
  food: { name: 'food', type: 'pickup', effects: [['health', 10]] },
};

/**
 * Initialize the play area with starting conditions
 */
function init() {
  GAME.currentRoom = ROOM.A;
  GAME.map = generateMap();
  GAME.board = createBoard(c.boardWidth, c.boardHeight, c.emptySpace);
  GAME.player = initPlayer('Legolas', 'Elf');
  // drawScreen();
}

/**
 * Initialize the dungeon map and the items and enemies in it
 */
function generateMap() {
  return {
    [ROOM.A]: {
      layout: [10, 10, 20, 20],
      gates: [
        { to: ROOM.B, x: 20, y: 15, icon: c.gateVertical, playerStart: { x: 7, y: 15 } },
        // { to: ROOM.B, x: 10, y: 18, icon: c.gateVertical, playerStart: { x: 19, y: 11 } },
        // { to: ROOM.B, x: 13, y: 20, icon: c.gateHorizontal, playerStart: { x: 19, y: 11 } },
      ],
      enemies: [],
      items: [
        { item: ITEMS.food, icon: 'f', x: 11, y: 11 },
        { item: ITEMS.food, icon: 'f', x: 11, y: 19 },
      ],
    },
    [ROOM.B]: {
      layout: [13, 6, 17, 70],
      gates: [{ to: ROOM.A, x: 6, y: 15, icon: c.gateVertical, playerStart: { x: 19, y: 15 } }],
      enemies: [
        // { type: ENEMY.RAT, x: 25, y: 15, name: "Rattata", ...ENEMY_INFO[ENEMY.RAT] },
      ],
      items: [],
    },
  };
}

/**
 * Display the board on the screen
 * @param {*} board the gameplay area
 */
function displayBoard(board) {
  let screen = '';
  for (const row of board) {
    screen = screen.concat(row.join(''), '\n');
  }
  _displayBoard(screen);
}

/**
 * Draw the rectangular room, and show the items, enemies and the player on the screen, then print to the screen
 */
function drawScreen() {
  // ... reset the board with `createBoard`
  GAME.board = createBoard(c.boardWidth, c.boardHeight, c.emptySpace);
  // ... use `drawRoom`
  drawRoom(GAME.board, ...GAME.map[GAME.currentRoom].layout);
  // ... print entities with `addToBoard`
  addToBoard(GAME.board, GAME.player, GAME.player.icon);
  for (const item of GAME.map[GAME.currentRoom].items) {
    addToBoard(GAME.board, item, item.icon);
  }
  displayBoard(GAME.board);
  showStats(GAME.player);
}

/**
 * Implement the turn based movement. Move the player, move the enemies, show the statistics and then print the new frame.
 *
 * @param {*} yDiff
 * @param {*} xDiff
 * @returns
 */
function moveAll(yDiff, xDiff) {
  move(GAME.player, yDiff, xDiff);
  // ... use `move` to move all entities
  // ... show statistics with `showStats`
  // ... reload screen with `drawScreen`
  drawScreen();
}

/**
 * Implement the movement of an entity (enemy/player)
 *
 * - Do not let the entity out of the screen.
 * - Do not let them mve through walls.
 * - Let them visit other rooms.
 * - Let them attack their enemies.
 * - Let them move to valid empty space.
 *
 * @param {*} who entity that tried to move
 * @param {number} yDiff difference in Y coord
 * @param {number} xDiff difference in X coord
 * @returns
 */
function move(who, yDiff, xDiff) {
  // ... check if move to empty space
  if (GAME.board[who.y + yDiff][who.x + xDiff] === c.emptySpace) {
    GAME.board[who.y][who.x] = c.emptySpace;
    who.x += xDiff;
    who.y += yDiff;
    GAME.board[who.y][who.x] = who.icon;
  } else if (GAME.board[who.y + yDiff][who.x + xDiff] === c.wall) {
    // ... check if hit a wall
    return;
  } else if (
    GAME.board[who.y + yDiff][who.x + xDiff] === c.gateHorizontal ||
    GAME.board[who.y + yDiff][who.x + xDiff] === c.gateVertical
  ) {
    // ... check if move to new room (`removeFromBoard`, `addToBoard`)
    for (const door of GAME.map[GAME.currentRoom].gates) {
      if (who.y + yDiff === door.y && who.x + xDiff === door.x) {
        GAME.currentRoom = door.to;
        removeFromBoard(GAME.board, GAME.player);
        addToBoard(GAME.board, door.playerStart, GAME.player.icon);
        GAME.player.x = door.playerStart.x;
        GAME.player.y = door.playerStart.y;
      }
    }
    console.log('leave Room');
  } else if (GAME.board[who.y + yDiff][who.x + xDiff] === 'f') {
    // get item
    const itemList = GAME.map[GAME.currentRoom].items;
    for (const index in itemList) {
      if (who.y + yDiff === itemList[index].y && who.x + xDiff === itemList[index].x) {
        getItem(itemList[index].item);
        itemList.splice(Number(index), 1);
      }
    }
    // removeFromBoard(GAME.board);
    GAME.board[who.y][who.x] = c.emptySpace;
    who.x += xDiff;
    who.y += yDiff;
    GAME.board[who.y][who.x] = who.icon;
  }
  // ... check if attack enemy
  // ... check if attack player
  //     ... use `_gameOver()` if necessary
}

/**
 * Check if the entity found anything actionable.
 *
 * @param {*} board the gameplay area
 * @param {*} y Y position on the board
 * @param {*} x X position on the board
 * @returns boolean if found anything relevant
 */
function hit(board, y, x) {
  // ...
}

/**
 * Add entity to the board
 *
 * @param {*} board the gameplay area
 * @param {*} item anything with position data
 * @param {string} icon icon to print on the screen
 */
function addToBoard(board, item, icon) {
  board[item.y][item.x] = icon;
}

/**
 * Remove entity from the board
 *
 * @param {*} board the gameplay area
 * @param {*} item anything with position data
 */
function removeFromBoard(board, item) {
  board[item.y][item.x] = c.emptySpace;
}

/**
 * Create the gameplay area to print
 *
 * @param {number} width width of the board
 * @param {number} height height of the board
 * @param {string} emptySpace icon to print as whitespace
 * @returns
 */
function createBoard(width, height, emptySpace) {
  const board = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push(emptySpace);
    }
    board.push(row);
  }
  return board;
}

/**
 * Draw a rectangular room
 *
 * @param {*} board the gameplay area to update with the room
 * @param {*} topY room's top position on Y axis
 * @param {*} leftX room's left position on X axis
 * @param {*} bottomY room's bottom position on Y axis
 * @param {*} rightX room's right position on X axis
 */
function drawRoom(board, topY, leftX, bottomY, rightX) {
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      if (
        (y === topY && x >= leftX && x <= rightX) ||
        (y === bottomY && x >= leftX && x <= rightX) ||
        (x === leftX && y >= topY && y <= bottomY) ||
        (x === rightX && y >= topY && y <= bottomY)
      ) {
        board[y][x] = c.wall;
      }
    }
  }
  board[GAME.map[GAME.currentRoom].gates[0].y][GAME.map[GAME.currentRoom].gates[0].x] =
    GAME.map[GAME.currentRoom].gates[0].icon;
  console.dir(board);
}

/**
 * Print stats to the user
 *
 * @param {*} player player info
 * @param {array} enemies info of all enemies in the current room
 */
function showStats(player, enemies) {
  const playerStats = `Health: ${player.health}\nAttack: ${player.attack}\nDefense: ${player.defense}`;
  const enemyStats = '35'; // ... concatenate them with a newline
  _updateStats(playerStats, enemyStats);
}

function getItem(item) {
  if (item.type === 'pickup') {
    if (Object.keys(GAME.player.inventory).includes(item.name)) {
      GAME.player.inventory[item.name] += 1;
    } else {
      GAME.player.inventory[item.name] = 1;
    }
    manageInventory();
  } else {
    useItem(item);
  }
  console.log(GAME.player.inventory);
}

function useItem(item) {
  for (const effect of item.effects) {
    GAME.player[effect[0]] += effect[1];
  }
}

function manageInventory() {
  const invBox = document.querySelector('#inventory');
  // while (invBox.lastElementChild) {
  //   invBox.removeChild(invBox.lastElementChild);
  // }
  if (Object.keys(GAME.player.inventory).length) {
    for (const item of Object.entries(GAME.player.inventory)) {
      const type = ITEMS[item[0]];
      const p = document.createElement('p');
      p.innerText = `${item[0]}: ${item[1]}`;
      p.addEventListener('click', () => {
        useItem(type);
        drawScreen();
        GAME.player.inventory[item[0]]--;
        if (GAME.player.inventory[item[0]] === 0) delete GAME.player.inventory[item[0]];
        manageInventory();
      });
      invBox.appendChild(p);
    }
  } else {
    const p = document.createElement('p');
    p.innerText = 'No items';
    invBox.appendChild(p);
  }
}

/**
 * Update the gameplay area in the DOM
 * @param {*} board the gameplay area
 */
function _displayBoard(screen) {
  document.getElementById('screen').innerText = screen;
}

/**
 * Update the gameplay stats in the DOM
 *
 * @param {*} playerStatText stats of the player
 * @param {*} enemyStatText stats of the enemies
 */
function _updateStats(playerStatText, enemyStatText) {
  const playerStats = document.getElementById('playerStats');
  playerStats.innerText = playerStatText;
  const enemyStats = document.getElementById('enemyStats');
  enemyStats.innerText = enemyStatText;
}

/**
 * Keep a reference of the existing keypress listener, to be able to remove it later
 */
let _keypressListener = null;

/**
 * Code to run after the player ddecided to start the game.
 * Register the movement handler, and make sure that the boxes are hidden.
 *
 * @param {function} moveCB callback to handle movement of all entities in the room
 */
function _start(moveCB) {
  const msgBox = document.getElementById('startBox');
  const endBox = document.getElementById('endBox');
  const invBox = document.querySelector('#inventory');
  endBox.classList.add('is-hidden');
  GAME.player.name = document.getElementById('playerName').value;
  GAME.player.race = document.getElementById('playerRace').value;
  msgBox.classList.toggle('is-hidden');
  _keypressListener = (e) => {
    let xDiff = 0;
    let yDiff = 0;
    switch (e.key.toLocaleLowerCase()) {
      case 'w': {
        yDiff = -1;
        xDiff = 0;
        break;
      }
      case 's': {
        yDiff = 1;
        xDiff = 0;
        break;
      }
      case 'a': {
        yDiff = 0;
        xDiff = -1;
        break;
      }
      case 'd': {
        yDiff = 0;
        xDiff = 1;
        break;
      }
      case 'i': {
        invBox.classList.toggle('is-hidden');
      }
    }
    if (xDiff !== 0 || yDiff !== 0) {
      moveCB(yDiff, xDiff);
    }
  };
  document.addEventListener('keypress', _keypressListener);
  drawScreen();
  manageInventory();
}

/**
 * Code to run when the player died.
 *
 * Makes sure that the proper boxes are visible.
 */
function _gameOver() {
  const msgBox = document.getElementById('startBox');
  msgBox.classList.add('is-hidden');
  const endBox = document.getElementById('endBox');
  endBox.classList.remove('is-hidden');
  if (_keypressListener) {
    document.removeEventListener('keypress', _keypressListener);
  }
}

/**
 * Code to run when the player hits restart.
 *
 * Makes sure that the proper boxes are visible.
 */
function _restart() {
  const msgBox = document.getElementById('startBox');
  msgBox.classList.remove('is-hidden');
  const endBox = document.getElementById('endBox');
  endBox.classList.add('is-hidden');
  init();
}

init();
