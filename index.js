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
    y: 18,
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
const DIRECTIONS = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

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
  [ENEMY.RAT]: { health: 30, attack: 1, defense: 1, icon: ENEMY.RAT, race: 'Rat', isBoss: false, range: 5, fields: [] },
  [ENEMY.DALEK]: {
    health: 150,
    attack: 3,
    defense: 2,
    ranged: 2,
    icon: ENEMY.DALEK,
    race: 'Dalek',
    isBoss: true,
    range: Infinity,
    shoot: false,
    fields: [],
  },
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
        { to: ROOM.B, x: 20, y: 15, icon: c.gateVertical, playerStart: { x: 7, y: 15 }, needKey: false },
        // { to: ROOM.B, x: 10, y: 18, icon: c.gateVertical, playerStart: { x: 19, y: 11 } },
        // { to: ROOM.B, x: 13, y: 20, icon: c.gateHorizontal, playerStart: { x: 19, y: 11 } },
      ],
      enemies: [],
      items: [{ item: ITEMS.food, icon: 'f', x: 16, y: 15 }],
    },
    [ROOM.B]: {
      layout: [13, 6, 17, 70],
      gates: [
        { to: ROOM.A, x: 6, y: 15, icon: c.gateVertical, playerStart: { x: 19, y: 15 }, needKey: false },
        { to: ROOM.C, x: 35, y: 13, icon: c.gateHorizontal, playerStart: { x: 35, y: 19 }, needKey: false },
        { to: ROOM.D, x: 70, y: 15, icon: c.gateVertical, playerStart: { x: 12, y: 15 }, needKey: true },
      ],
      enemies: [{ type: ENEMY.RAT, x: 30, y: 14, name: 'Rattata', ...ENEMY_INFO[ENEMY.RAT] }],
      items: [
        { item: ITEMS.food, icon: 'f', x: 35, y: 16 },
        { item: ITEMS.potion, icon: 'p', x: 68, y: 15 },
      ],
    },
    [ROOM.C]: {
      layout: [10, 25, 20, 45],
      gates: [{ to: ROOM.B, x: 35, y: 20, icon: c.gateHorizontal, playerStart: { x: 35, y: 14 }, needKey: false }],
      enemies: [
        { type: ENEMY.RAT, x: 40, y: 16, name: 'Mr. Patkányka', ...ENEMY_INFO[ENEMY.RAT] },
        { type: ENEMY.RAT, x: 33, y: 13, name: 'Mrs. Patkányka', ...ENEMY_INFO[ENEMY.RAT] },
      ],
      items: [
        { item: ITEMS.armor, icon: 'a', x: 30, y: 15 },
        { item: ITEMS.sword, icon: 's', x: 28, y: 18 },
        { item: ITEMS.crossbow, icon: 'c', x: 43, y: 12 },
        { item: ITEMS.key, icon: 'k', x: 29, y: 13 },
      ],
    },

    [ROOM.D]: {
      layout: [8, 11, 22, 72],
      gates: [{ to: ROOM.B, x: 11, y: 15, icon: c.gateVertical, playerStart: { x: 69, y: 15 }, needKey: false }],
      enemies: [{ type: ENEMY.DALEK, x: 60, y: 15, name: 'Dalek Caan', ...ENEMY_INFO[ENEMY.DALEK] }],
      items: [{ item: ITEMS.potion, icon: 'p', x: 65, y: 15 }],
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
  for (const projectile of PROJECTILES) {
    addToBoard(GAME.board, projectile, projectile.icon);
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
function moveAll(yDiff, xDiff, fired) {
  movePlayer(GAME.player, yDiff, xDiff, fired);
  drawScreen();
  console.log(PROJECTILES);
  let removedProjectiles = []
  for (const index in PROJECTILES) {
    moveProjectile(PROJECTILES[index], removedProjectiles, Number(index));
  }
  removedProjectiles = removedProjectiles.reverse();
  console.log(removedProjectiles);
  for (const projectileIndex of removedProjectiles) {
    PROJECTILES.splice(projectileIndex, 1);
  }
  drawScreen();
  for (const enemy of GAME.map[GAME.currentRoom].enemies) {
    if (enemy.isBoss) moveBoss(enemy);
    else moveEnemy(enemy);
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
function movePlayer(who, yDiff, xDiff, fired) {
  if (fired) {
    shoot(fired, who.x, who.y, who);
    return;
  }
  const nextField = GAME.board[who.y + yDiff][who.x + xDiff];
  // ... check if move to empty space
  if (nextField === c.emptySpace) {
    move(who, yDiff, xDiff);
  } else if (nextField === c.wall) {
    // ... check if hit a wall
    return;
  } else if (
    nextField === c.gateHorizontal ||
    nextField === c.gateVertical
  ) {
    // ... check if move to new room
    for (const door of GAME.map[GAME.currentRoom].gates) {
      if (who.y + yDiff === door.y && who.x + xDiff === door.x) {
        if (door.needKey) {
          if (GAME.player.inventory['key'] === 0) {
            messageLogger('You need a key!');
            return;
          }
        }
        GAME.currentRoom = door.to;
        removeFromBoard(GAME.board, GAME.player);
        addToBoard(GAME.board, door.playerStart, GAME.player.icon);
        GAME.player.x = door.playerStart.x;
        GAME.player.y = door.playerStart.y;
      }
    }
    PROJECTILES.length = 0;
    console.log('leave Room');
  } else if (
    'facksp'.includes(nextField)
  ) {
    // get item
    if (nextField === 'k') {
      messageLogger('You picked up a key');
    } else if (nextField === 'a') {
      messageLogger('Your armor is increased by 1');
    } else if (nextField === 's') {
      messageLogger('Your melee damage is increased by 3');
    } else if (nextField === 'c') {
      messageLogger('You found a crossbow');
    } else if (nextField === 'p') {
      messageLogger('You picked up a potion');
    }
    const itemList = GAME.map[GAME.currentRoom].items;
    const index = getIndexFromList(itemList, who.x + xDiff, who.y + yDiff);
    getItem(itemList[index].item);
    itemList.splice(index, 1);
    move(who, yDiff, xDiff);
  } else if (Object.values(ENEMY).flat(Infinity).includes(nextField)) {
    const target = findTarget(who.y + yDiff, who.x + xDiff);
    attack(who, target);
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

function getIndexFromList(list, x, y) {
  for (const index in list) {
    if (y === list[index].y && x === list[index].x) {
      return Number(index);
    }
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
    who.shoot = true;
    return;
  }
  if (who.shoot) {
    shoot('left', who.x - 2, who.y, who);
    shoot('right', who.x + 2, who.y, who);
    shoot('up', who.x, who.y - 2, who);
    shoot('down', who.x, who.y + 2, who);
    who.shoot = false;
    return;
  } else if (GAME.player.y === who.y || GAME.player.x === who.x) {
    who.shoot = true;
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
  who.shoot = true;
}

function moveProjectile(projectile, removed, index) {
  const nextField = GAME.board[projectile.y + projectile.direction[0]][projectile.x + projectile.direction[1]];
  console.log(nextField);
  if (nextField === c.emptySpace) {
    move(projectile, projectile.direction[0], projectile.direction[1]);
    return;
  } else if (nextField === GAME.player.icon) {
    ('attack');
    attack(projectile, GAME.player);
  } else if (Object.values(ENEMY).flat(Infinity).includes(nextField)) {
    const target = findTarget(projectile.y + projectile.direction[0], projectile.x + projectile.direction[1]);
    attack(projectile, target);
  }
  removeFromBoard(GAME.board, projectile);
  removed.push(index);
}

function move(who, yDiff, xDiff) {
  removeFromBoard(GAME.board, who);
  who.x += xDiff;
  who.y += yDiff;
  addToBoard(GAME.board, who, who.icon);
}

function findTarget(y, x) {
  for (const enemy of GAME.map[GAME.currentRoom].enemies) {
    for (const field of enemy.fields) {
      if (field[0] === y && field[1] === x) {
        return enemy;
      }
    }
  }
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
    item.fields = []
    board[item.y][item.x] = icon;
    item.fields.push([item.y, item.x]);
  } else {
    const height = icon.length;
    const width = icon[0].length;
    const startY = item.y - Math.floor(height / 2);
    const startX = item.x - Math.floor(height / 2);
    item.fields = []
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        board[startY + y][startX + x] = icon[y][x];
        item.fields.push([startY + y, startX + x]);
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

function attack(attacker, attackee) {
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
      _gameOver(attacker.name);
    } else {
      const enemyList = GAME.map[GAME.currentRoom].enemies;
      enemyList.splice(getIndexFromList(enemyList, attackee.x, attackee.y), 1);
      messageLogger(`${attackee.name} is defeated!`);
      if (attackee.isBoss) {
        _gameOver(GAME.player.name);
      }
    }
  }
}

/**
 * @param {string} direction ArrowRight ArrowUp ArrowDown ArrowLeft
 * @param {int} shooterX x position to count from depending on direction
 * @param {int} shooterY y position to count from depending on direction
 * @param {*} shooterRangeDamage the damage the projectile should deal when hit
 */
function shoot(direction, shooterX, shooterY, shooter,) {
  let startCoordinateX;
  let startCoordinateY;
  let icon;
  switch (direction) {
    case 'right':
      startCoordinateX = shooterX + 1;
      startCoordinateY = shooterY;
      icon = '>';
      direction = DIRECTIONS.right;
      break;
    case 'up':
      startCoordinateX = shooterX;
      startCoordinateY = shooterY - 1;
      icon = 'Ʌ';
      direction = DIRECTIONS.up;
      break;
    case 'down':
      startCoordinateX = shooterX;
      startCoordinateY = shooterY + 1;
      icon = 'V';
      direction = DIRECTIONS.down;
      break;
    case 'left':
      startCoordinateX = shooterX - 1;
      startCoordinateY = shooterY;
      icon = '<';
      direction = DIRECTIONS.left;
      break;
  }
  if (GAME.board[startCoordinateY][startCoordinateX] === c.emptySpace) {
    PROJECTILES.push({
      id: PROJECTILES.length,
      name: shooter.name,
      direction: direction,
      icon: icon,
      attack: shooter.ranged,
      x: startCoordinateX,
      y: startCoordinateY,
    });
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
  //const endBox = document.getElementById('endBox');
  const invBox = document.querySelector('#inventory');
  //endBox.classList.add('is-hidden');
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
    let fired = '';
    console.log(e.key.toLocaleLowerCase());
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
      case 'arrowup': {
        fired = 'up'
        break;
      }
      case 'arrowdown': {
        fired = 'down'
        break;
      }
      case 'arrowright': {
        fired = 'right';
        break;
      }
      case 'arrowleft': {
        fired = 'left';
        console.log(fired);
        break;
      }
    }
    if (xDiff !== 0 || yDiff !== 0 || (fired && GAME.player.inventory.crossbow > 0)) {
      moveCB(yDiff, xDiff, fired);
    }
  };
  document.addEventListener('keydown', _keypressListener);
  drawScreen();
  /* for (const item of Object.keys(ITEMS)) {
    if (item == 'food') {
      continue;
    } else {
      GAME.player.inventory[item] = 0;
    }
  }
  manageInventory(); */
}

/**
 * Code to run when the player died.
 *
 * Makes sure that the proper boxes are visible.
 */
function _gameOver(winner) {
  // const msgBox = document.getElementById('startBox');
  // msgBox.classList.add('is-hidden');
  // const endBox = document.getElementById('endBox');
  // endBox.classList.remove('is-hidden');
  const logBox = document.querySelector('#message-log');
  if (winner === GAME.player.name) {
    messageLogger(`${winner.toUpperCase()} IS VICTORIOUS!`);
    logBox.lastElementChild.classList.add('green');
  } else {
    messageLogger(`GAME OVER, ${winner.toUpperCase()} DEFEATED YOU!`);
    logBox.lastElementChild.classList.add('red');
  }
  if (_keypressListener) {
    document.removeEventListener('keydown', _keypressListener);
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
