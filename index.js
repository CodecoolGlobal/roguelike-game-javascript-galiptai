'use strict';
/**
 * Unchangable configuration variables
 */
const c = Object.freeze({
  emptySpace: ' ',
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
function initPlayer(pname, prace) {
  return {
    x: 15,
    y: 15,
    name: pname,
    icon: '@',
    race: prace,
    health: 100,
    attack: 1,
    ranged: 0,
    defense: 1,
    isPlayer: true,
    inventory: { potion: 0, key: 0, sword: 0, crossbow: 0, shield: 0 },
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
  RAT: 'r',
  DALEK: [
    ['O', 'O', '|', 'O', 'O'],
    ['O', 'O', '|', 'O', 'O'],
    ['-', '-', 'X', '-', '-'],
    ['O', 'O', '|', 'O', 'O'],
    ['O', 'O', '|', 'O', 'O'],
  ],
};

/**
 *
 * @param {string} message message to be logged to the site after action
 */
function messageLogger(message) {
  const logBox = document.querySelector('#message-log');
  const logDivArr = Array.from(document.querySelectorAll('#message-log>div'));
  if (logDivArr.length === 0) {
    logBox.classList.remove('is-hidden');
  }
  const elem = document.createElement('div');
  elem.innerText = message;
  if (logDivArr.length === 5) {
    logBox.firstElementChild.remove();
  }
  logBox.appendChild(elem);
}

/**
 * Info of the enemies
 */
const ENEMY_INFO = {
  [ENEMY.RAT]: { health: 30, attack: 1, defense: 1, icon: ENEMY.RAT, race: 'Rat', isBoss: false, range: 5 },
  [ENEMY.DALEK]: { health: 80, attack: 3, defense: 2, icon: ENEMY.DALEK, race: 'Dalek', isBoss: true, range: Infinity },
};

const ITEMS = {
  food: { name: 'food', type: 'instant', effects: [['health', 10]] },
  armor: { name: 'armor', type: 'pickup', effects: [['defense', 1]], passive: true },
  crossbow: { name: 'crossbow', type: 'pickup', effects: [['ranged', 2]], passive: true /*ammo: 'infinite'*/ },
  sword: { name: 'sword', type: 'pickup', effects: [['attack', 3]], passive: true },
  key: { name: 'key', type: 'pickup', effects: 'open', passive: false },
  potion: { name: 'potion', type: 'pickup', effects: [['health', 50]], passive: false },
};

const PROJECTILES = [];

/**
 * Initialize the play area with starting conditions
 */
function init() {
  GAME.currentRoom = ROOM.A;
  GAME.map = generateMap();
  GAME.board = createBoard(c.boardWidth, c.boardHeight, c.emptySpace);
  GAME.player = initPlayer('Legolas', 'Elf');
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
        { item: ITEMS.armor, icon: 'a', x: 14, y: 15 },
        { item: ITEMS.sword, icon: 's', x: 13, y: 15 },
        { item: ITEMS.crossbow, icon: 'c', x: 12, y: 15 },
        { item: ITEMS.key, icon: 'k', x: 11, y: 15 },
        { item: ITEMS.potion, icon: 'p', x: 16, y: 15 },
        { item: ITEMS.potion, icon: 'p', x: 17, y: 15 },
      ],
    },
    [ROOM.B]: {
      layout: [13, 6, 17, 70],
      gates: [
        { to: ROOM.A, x: 6, y: 15, icon: c.gateVertical, playerStart: { x: 19, y: 15 } },
        { to: ROOM.D, x: 70, y: 15, icon: c.gateVertical, playerStart: { x: 12, y: 15 } },
      ],
      enemies: [
        { type: ENEMY.RAT, x: 35, y: 16, name: 'Rattata', ...ENEMY_INFO[ENEMY.RAT] },
        { type: ENEMY.RAT, x: 55, y: 14, name: 'Patkányka', ...ENEMY_INFO[ENEMY.RAT] },
      ],
      items: [],
    },
    [ROOM.D]: {
      layout: [8, 11, 22, 72],
      gates: [{ to: ROOM.B, x: 11, y: 15, icon: c.gateVertical, playerStart: { x: 69, y: 15 } }],
      enemies: [{ type: ENEMY.DALEK, x: 60, y: 15, name: 'Dalek Caan', ...ENEMY_INFO[ENEMY.DALEK] }],
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
  for (const enemy of GAME.map[GAME.currentRoom].enemies) {
    addToBoard(GAME.board, enemy, enemy.icon);
  }
  displayBoard(GAME.board);
  showStats(GAME.player, GAME.map[GAME.currentRoom].enemies);
}

/**
 * Implement the turn based movement. Move the player, move the enemies, show the statistics and then print the new frame.
 *
 * @param {*} yDiff
 * @param {*} xDiff
 * @returns
 */
function moveAll(yDiff, xDiff) {
  movePlayer(GAME.player, yDiff, xDiff);
  drawScreen();
  for (const enemy of GAME.map[GAME.currentRoom].enemies) {
    if (!enemy.isBoss) moveEnemy(enemy);
    else moveBoss(enemy);
  }
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
function movePlayer(who, yDiff, xDiff) {
  // ... check if move to empty space
  if (GAME.board[who.y + yDiff][who.x + xDiff] === c.emptySpace) {
    move(who, yDiff, xDiff);
  } else if (GAME.board[who.y + yDiff][who.x + xDiff] === c.wall) {
    // ... check if hit a wall
    return;
  } else if (
    GAME.board[who.y + yDiff][who.x + xDiff] === c.gateHorizontal ||
    GAME.board[who.y + yDiff][who.x + xDiff] === c.gateVertical
  ) {
    // ... check if move to new room
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
  } else if (
    GAME.board[who.y + yDiff][who.x + xDiff] === 'f' ||
    GAME.board[who.y + yDiff][who.x + xDiff] === 'a' ||
    GAME.board[who.y + yDiff][who.x + xDiff] === 'c' ||
    GAME.board[who.y + yDiff][who.x + xDiff] === 's' ||
    GAME.board[who.y + yDiff][who.x + xDiff] === 'k' ||
    GAME.board[who.y + yDiff][who.x + xDiff] === 'p'
  ) {
    // get item
    if (GAME.board[who.y + yDiff][who.x + xDiff] === 'k') {
      messageLogger('You picked up a key');
    } else if (GAME.board[who.y + yDiff][who.x + xDiff] === 'a') {
      messageLogger('your armor is increased');
    } else if (GAME.board[who.y + yDiff][who.x + xDiff] === 's') {
      messageLogger('your melee damage is increased');
    } else if (GAME.board[who.y + yDiff][who.x + xDiff] === 'c') {
      messageLogger('your ranged damage is increased');
    } else if (GAME.board[who.y + yDiff][who.x + xDiff] === 'p') {
      messageLogger('You picked up a potion');
    }
    const itemList = GAME.map[GAME.currentRoom].items;
    for (const index in itemList) {
      if (who.y + yDiff === itemList[index].y && who.x + xDiff === itemList[index].x) {
        getItem(itemList[index].item);
        itemList.splice(Number(index), 1);
      }
    }
    move(who, yDiff, xDiff);
  } else if (GAME.board[who.y + yDiff][who.x + xDiff] === 'r') {
    const enemyList = GAME.map[GAME.currentRoom].enemies;
    for (const index in enemyList) {
      if (who.x + xDiff === enemyList[index].x && who.y + yDiff === enemyList[index].y) {
        attack(GAME.player, enemyList[index], Number(index));
      }
    }
  }
  //     ... use `_gameOver()` if necessary
}

function moveEnemy(who) {
  const yDist = who.y - GAME.player.y;
  const xDist = who.x - GAME.player.x;
  const distFromPlayer = Math.sqrt(Math.abs(yDist) ** 2 + Math.abs(xDist) ** 2);
  if (distFromPlayer > who.range) {
    switch (Math.floor(Math.random() * 4)) {
      case 0:
        if (GAME.board[who.y + 1][who.x] === c.emptySpace) move(who, 1, 0);
        break;
      case 1:
        if (GAME.board[who.y - 1][who.x] === c.emptySpace) move(who, -1, 0);
        break;
      case 2:
        if (GAME.board[who.y][who.x + 1] === c.emptySpace) move(who, 0, 1);
        break;
      case 3:
        if (GAME.board[who.y][who.x - 1] === c.emptySpace) move(who, 0, -1);
        break;
    }
  } else if (Math.abs(yDist) > 1 || Math.abs(xDist) > 1 || (Math.abs(xDist) === 1 && Math.abs(yDist) === 1)) {
    if (Math.abs(yDist) > Math.abs(xDist)) {
      if (yDist < 0) {
        if (GAME.board[who.y + 1][who.x] === c.emptySpace) {
          move(who, 1, 0);
          return;
        }
      } else {
        if (GAME.board[who.y - 1][who.x] === c.emptySpace) {
          move(who, -1, 0);
          return;
        }
      }
    }
    if (xDist < 0) {
      if (GAME.board[who.y][who.x + 1] === c.emptySpace) {
        move(who, 0, 1);
        return;
      }
    } else {
      if (GAME.board[who.y][who.x - 1] === c.emptySpace) {
        move(who, 0, -1);
        return;
      }
    }
  } else {
    attack(who, GAME.player);
  }
}

function moveBoss(who) {
  if (
    ((GAME.player.y === who.y - 3 || GAME.player.y === who.y + 3) &&
      GAME.player.x > who.x - 3 &&
      GAME.player.x < who.x + 3) ||
    ((GAME.player.x === who.x - 3 || GAME.player.x === who.x + 3) &&
      GAME.player.y > who.y - 3 &&
      GAME.player.y < who.y + 3)
  ) {
    attack(who, GAME.player);
    return;
  } else if (GAME.player.y === who.y || GAME.player.x === who.x) {
    console.log('shoot');
    return;
  }
  const yDist = who.y - GAME.player.y;
  const xDist = who.x - GAME.player.x;
  const canMoveVerticalToShoot = !(
    GAME.player.y <= GAME.map[GAME.currentRoom].layout[0] + 2 ||
    GAME.player.y >= GAME.map[GAME.currentRoom].layout[2] - 2
  );
  const canMoveHorizontalToShoot = !(
    GAME.player.x <= GAME.map[GAME.currentRoom].layout[1] + 2 ||
    GAME.player.x >= GAME.map[GAME.currentRoom].layout[3] - 2
  );
  if (Math.abs(yDist) <= Math.abs(xDist) && canMoveVerticalToShoot) {
    console.log('1');
    const value = yDist > 0 ? -1 : 1;
    move(who, value, 0);
  } else if (Math.abs(xDist) <= Math.abs(yDist) && canMoveHorizontalToShoot) {
    console.log('2');
    const value = xDist > 0 ? -1 : 1;
    move(who, 0, value);
  } else if (canMoveVerticalToShoot) {
    console.log('3');
    const value = yDist > 0 ? -1 : 1;
    move(who, value, 0);
  } else if (canMoveHorizontalToShoot) {
    console.log('4');
    const value = xDist > 0 ? -1 : 1;
    move(who, 0, value);
  } else if (
    Math.abs(yDist) <= Math.abs(xDist) &&
    who.y - 3 > GAME.map[GAME.currentRoom].layout[0] &&
    who.y + 3 < GAME.map[GAME.currentRoom].layout[2]
  ) {
    console.log('5');
    const value = yDist > 0 ? -1 : 1;
    move(who, value, 0);
  } else {
    console.log('6');
    const value = xDist > 0 ? -1 : 1;
    move(who, 0, value);
  }
}

function move(who, yDiff, xDiff) {
  removeFromBoard(GAME.board, who);
  who.x += xDiff;
  who.y += yDiff;
  addToBoard(GAME.board, who, who.icon);
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
  if (typeof item.icon === 'string') {
    board[item.y][item.x] = icon;
  } else {
    const height = icon.length;
    const width = icon[0].length;
    const startY = item.y - Math.floor(height / 2);
    const startX = item.x - Math.floor(height / 2);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        board[startY + y][startX + x] = icon[y][x];
      }
    }
  }
}

/**
 * Remove entity from the board
 *
 * @param {*} board the gameplay area
 * @param {*} item anything with position data
 */
function removeFromBoard(board, item) {
  if (typeof item.icon === 'string') {
    board[item.y][item.x] = c.emptySpace;
  } else {
    const height = item.icon.length;
    const width = item.icon[0].length;
    const startY = item.y - Math.floor(height / 2);
    const startX = item.x - Math.floor(height / 2);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        board[startY + y][startX + x] = c.emptySpace;
      }
    }
  }
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
  const gateList = GAME.map[GAME.currentRoom].gates;
  for (const gate of gateList) {
    board[gate.y][gate.x] = gate.icon;
  }
}

/**
 * Print stats to the user
 *
 * @param {*} player player info
 * @param {array} enemies info of all enemies in the current room
 */
function showStats(player, enemies) {
  const playerStats = `Health: ${player.health}\nAttack: ${player.attack}\nDefense: ${player.defense}\nRanged: ${player.ranged}`;
  let enemyStats = '';
  for (const enemy of enemies) {
    enemyStats = enemyStats.concat(`${enemy.name}: ${enemy.health}\n`);
  }
  _updateStats(playerStats, enemyStats);
}

function getItem(item) {
  if (item.type === 'instant') {
    useItem(item);
    messageLogger('Your health is increased by 10');
  } else {
    GAME.player.inventory[item.name] += 1;
    manageInventory(item.name);
    if (item.passive) {
      useItem(item);
    }
  }
}
function useItem(item) {
  for (const effect of item.effects) {
    GAME.player[effect[0]] += effect[1];
  }
}

function manageInventory(item) {
  const type = ITEMS[item];
  const inventoryBox = Array.from(document.querySelectorAll('#inventory>div'));
  for (const i of inventoryBox) {
    if (i.id === item) {
      i.lastElementChild.innerHTML = Number(i.lastElementChild.textContent) + 1;
    }
  }
  /*
   if (i.id == 'potion') {
      i.addEventListener('keypress', () => {
        useItem(type);
        drawScreen();
        //console.log(ITEMS[item[0]]);
        i.lastElementChild.innerText = Number(i.lastElementChild.innerText) - 1;
        manageInventory();
      })
    }
  inventoryBox.id;
  inventoryBox[type].innerText = `${item[0]}: ${item[1]}`;
  p.addEventListener('click', () => {
    useItem(type);
    drawScreen();
    //console.log(ITEMS[item[0]]);
    if (ITEMS[item[0]].name != 'key') {
      GAME.player.inventory[item[0]]--;
    }
    if (GAME.player.inventory[item[0]] === 0) delete GAME.player.inventory[item[0]];
    manageInventory();
  });
  //invBox.appendChild(p);*/
}

function attack(attacker, attackee, index) {
  messageLogger(`${attacker.name} attacks ${attackee.name}!`);
  const hitRoll = Math.floor(Math.random() * 10) + 1;
  if (hitRoll > attackee.defense) {
    const hit = attacker.attack * 10;
    attackee.health -= hit;
    messageLogger(`${attacker.name} hit ${attackee.name} for ${hit} damage!`);
  } else {
    messageLogger(`${attacker.name} missed!`);
  }
  if (attackee.health <= 0) {
    if (attackee === GAME.player) {
      console.log('Game over !');
    } else {
      const enemyList = GAME.map[GAME.currentRoom].enemies;
      enemyList.splice(Number(index), 1);
      messageLogger(`${attackee.name} is defeated!`);
    }
  }
}

/**
 * @param {string} direction ArrowRight ArrowUp ArrowDown ArrowLeft
 * @param {int} shooterX x position to count from depending on direction
 * @param {int} shooterY y position to count from depending on direction
 * @param {*} shooterRangeDamage the damage the projectile should deal when hit
 * @param {bool} isBoss def value false, if boss shoots, should be true
 */
function shoot(direction, shooterX, shooterY, shooterRangeDamage, isBoss = false) {
  let startCoordinateX;
  let startCoordinateY;
  let icon;
  switch (direction) {
    case 'ArrowRight':
      startCoordinateX = shooterX + 1;
      startCoordinateY = shooterY;
      icon = '-';
      break;
    case 'ArrowUp':
      startCoordinateX = shooterX;
      startCoordinateY = shooterY - 1;
      icon = '|';
      break;
    case 'ArrowDown':
      startCoordinateX = shooterX;
      startCoordinateY = shooterY + 1;
      icon = '|';
      break;
    case 'ArrowLeft':
      startCoordinateX = shooterX - 1;
      startCoordinateY = shooterY;
      icon = '-';
      break;
  }
  PROJECTILES.push({ icon: icon, damage: shooterRangeDamage, x: startCoordinateX, y: startCoordinateY });
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
  switch (GAME.player.race) {
    case 'Elf':
      GAME.player.defense = 2;
      if (GAME.player.name === '') GAME.player.name = 'Legolas';
      break;
    case 'Dwarf':
      GAME.player.attack = 2;
      if (GAME.player.name === '') GAME.player.name = 'Gimli';
      break;
    case 'Human':
      GAME.player.health = 120;
      if (GAME.player.name === '') GAME.player.name = 'Aragorn';
      break;
  }
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
        break;
      }
      case 'p': {
        if (GAME.player.inventory.potion > 0) {
          useItem(ITEMS.potion);
          drawScreen();
          document.getElementById('potion').lastElementChild.innerHTML -= 1;
          GAME.player.inventory.potion -= 1;
          messageLogger('Your health is increased by 50');
          console.log(GAME.player.inventory.potion);
        }
        break;
      }
      case 'ArrowUp': {
        //shoot bullet up
        break;
      }
      case 'ArrowDown': {
        //shoot bullet down
        break;
      }
      case 'ArrowRight': {
        //shoot bullet right
        break;
      }
      case 'ArrowLeft': {
        //shoot bullet left
        break;
      }
    }
    if (xDiff !== 0 || yDiff !== 0) {
      moveCB(yDiff, xDiff);
    }
  };
  document.addEventListener('keypress', _keypressListener);
  drawScreen();
  for (const item of Object.keys(ITEMS)) {
    if (item == 'food') {
      continue;
    } else {
      GAME.player.inventory[item] = 0;
    }
  }
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
