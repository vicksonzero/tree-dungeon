//@ts-check
import * as React from "react"
import { useEffect, useRef } from "react"
import './styles.css'
import styles from './App.module.css';
import { generateMap, map as initMap, drawMap } from "./models/map"
import { getMonster } from "./models/monsters"
import { getItem, weightedGetItem, doEffect, effectToString } from "./models/items"
import { capitalize, useLocalStorage } from './utils'



let uniqID = 0;

const actionTypes = {
  START_GAME: 'START_GAME',
  MOVE: 'MOVE', // nextID:number
  TICK: 'TICK',
  USE_ITEM: 'USE_ITEM', // backpackSlotID:number (0-3)
  KEEP_ITEM: 'KEEP_ITEM', // backpackSlotID (0-3, 4=loot)
  DROP_ITEM: 'DROP_ITEM', // backpackSlotID (0-3, 4=loot)
  FINISH_DROP: 'FINISH_DROP',
};

const initialState = {
  // game
  map: initMap,
  isCheat: false,

  // progress
  depth: 0,
  roomID: -1,
  roomHistory: [],
  phase: 'titleScreen', // titleScreen, endScreen, roomStart, fight, item, move, gameOver
  turn: 'player', // player, monster
  fightLogs: [],

  // entities
  player: {
    name: 'Player',
    actionPoints: 1,
    hp: 10,
    maxHp: 10,
  },
  keepBackpack: [],
  monster: null,
  loot: null,
  duplicatedLoot: null,
  backpack: [
    getItem('dagger'),
    null,
    null,
    null,
  ],
};

function gameStateReducer(state, action) {
  console.log(`gameStateReducer phase=${state.phase}, action=${JSON.stringify(action)}`);
  switch (state.phase) {
    case 'titleScreen': {
      if (action.type === actionTypes.START_GAME) {
        const { isCheat, backpack } = state;
        const nextState = {
          ...state,
          roomID: 0,
          depth: 0,
          map: {
            nodes: generateMap(action.gameSeed, action.gameDepth, 3),
          },
          player: {
            ...state.player,
            name: action.playerName,
          },
          backpack: [...backpack],
        };
        console.log(drawMap(nextState.map.nodes, 12));

        if (isCheat) {
          nextState.backpack[2] = {
            name: 'BF Sword',
            icon: '🍗',
            uses: 1000,
            descriptions: 'The Cheat Sword.',
            effects: [
              {
                type: 'dmg',
                amount: 100000,
              }
            ]
          };
          nextState.backpack[3] = {
            name: 'Teddy bear',
            icon: '🐻',
            uses: 100000,
            descriptions: 'For comfort. No other use.',
            effects: [
              {
                type: 'echo',
                message: 'Squeak!'
              }
            ]
          };
        }
        nextState.phase = 'roomStart';
        nextState.pauseFor = 2000;
        return nextState;
      }
      return state;
    }
    case 'endScreen': {

      return state;
    }
    case 'roomStart': {
      if (action.type === actionTypes.TICK) {
        const { map, roomID } = state;
        const nextState = {
          ...state,
          pauseFor: 0,
        };

        const nextRoom = map.nodes[roomID];

        console.log(`roomStart ${roomID} monster=${nextRoom?.monster?.name}`);
        nextState.monster = nextRoom.monster && getMonster(nextRoom.monster.name);
        nextState.fightLogs = [`A wild ${nextState.monster.name} appeared!`];

        if (nextState.monster) {
          nextState.phase = 'fight';
          nextState.turn = 'player';
          nextState.pauseFor = 100;
        } else {
          nextState.phase = 'item';
          nextState.pauseFor = 100;
        }


        return nextState;
      }

      return state;
    }
    case 'fight': {
      const { turn, player, monster, backpack, fightLogs } = state;
      console.log(`gameStateReducer:fight turn=${turn}`);
      if (action.type === actionTypes.TICK) {
        if (!monster || monster.hp <= 0) {
          const nextState = {
            ...state,
            pauseFor: 0,
          };

          nextState.phase = 'item';
          nextState.pauseFor = 100;
          nextState.fightLogs = [...fightLogs];
          nextState.fightLogs.push(`${player.name} wins!`);

          return nextState;
        }

        if (player.hp <= 0) {
          const nextState = {
            ...state,
            pauseFor: 0,
          };

          nextState.phase = 'gameOver';
          nextState.pauseFor = 100;
          nextState.fightLogs = [...fightLogs];
          nextState.fightLogs.push(`${player.name} fainted!`);

          return nextState;
        }

        if (turn === 'monster') {
          const nextState = {
            ...state,
          };
          if (Math.random() > monster.aggro) {
            nextState.turn = 'player';
            console.log(`gameStateReducer:fight ${monster.name} was not doing anything`);
            nextState.fightLogs = [...fightLogs];
            nextState.fightLogs.push(<>{monster.name} <span style={{ color: 'grey' }}>was not doing anything</span>...</>);
            return nextState;
          }

          console.log(`gameStateReducer:fight ${monster.name} used "${monster.attack.name}"`);
          nextState.fightLogs = [...fightLogs];
          nextState.fightLogs.push(`${monster.name} used "${monster.attack.name}"!`);
          for (const effect of monster.attack.effects) {
            const { me, them, fightLogs: fightLogs_b } = doEffect(effect, monster, player, nextState.fightLogs);

            nextState.fightLogs = fightLogs_b;
            nextState.player = them;
            nextState.monster = me;
            nextState.turn = 'player';
          }

          return nextState;
        }

        return state;


      } else if (action.type === actionTypes.USE_ITEM) {
        if (turn !== 'player') return state;

        const { backpackSlotID } = action;
        const nextState = {
          ...state,
          backpack: [...backpack],
        };
        const item = { ...backpack[backpackSlotID] };

        if (item.uses <= 0) return state;


        nextState.fightLogs = [...fightLogs];
        nextState.fightLogs.push(`${player.name} used "${item.name}"!`);
        for (const effect of item.effects) {
          const { me, them, fightLogs: fightLogs_b } = doEffect(effect, player, monster, nextState.fightLogs);

          nextState.fightLogs = fightLogs_b;
          nextState.player = me;
          nextState.monster = them;
        }

        item.uses -= 1;

        nextState.backpack[backpackSlotID] = item.uses <= 0 ? null : item;

        nextState.turn = 'monster';

        nextState.pauseFor = 1000;

        return nextState;
      }

      return state;
    }


    case 'item': {
      const { turn, player, monster, backpack, loot, map, roomID, keepBackpack } = state;
      console.log('gameStateReducer:item');
      const room = map.nodes[roomID];
      if (action.type === actionTypes.TICK) {
        const nextState = {
          ...state,
          pauseFor: 0,
          loot: null,
          duplicatedLoot: null,
        };

        nextState.keepBackpack = [];
        for (let i = 0; i < backpack.length; i++) {
          const item = backpack[i];
          if (item) nextState.keepBackpack.push(i);
        }

        if (room.loot) {
          const { itemTier, name, uses } = room.loot;
          console.log('itemTier', itemTier);

          const newLoot = (itemTier != null) ? weightedGetItem(itemTier, Math.random) : { ...getItem(name), uses };

          const duplicateItemIndex = backpack.findIndex(item => item && item.name === newLoot.name);
          console.log('duplicateItemIndex', newLoot.name, duplicateItemIndex, newLoot.uses);
          if (newLoot.uses > 0 && duplicateItemIndex > -1) { // if found
            nextState.backpack = [...backpack];
            nextState.backpack[duplicateItemIndex] = { ...nextState.backpack[duplicateItemIndex] };
            nextState.backpack[duplicateItemIndex].uses += newLoot.uses;
            nextState.duplicatedLoot = newLoot;
          } else {
            console.log(JSON.stringify(newLoot));
            nextState.loot = newLoot;
            nextState.keepBackpack.push(4);
          }
        }

        return nextState;
      }

      if (action.type === actionTypes.DROP_ITEM) {
        const index = keepBackpack.indexOf(action.backpackID);
        if (index < 0) return state;

        const nextState = {
          ...state,
        };

        nextState.keepBackpack.splice(index, 1);

        return nextState;
      }

      if (action.type === actionTypes.KEEP_ITEM) {
        const index = keepBackpack.indexOf(action.backpackID);
        if (index >= 0) return state;

        const nextState = {
          ...state,
        };

        nextState.keepBackpack.push(action.backpackID);

        return nextState;
      }


      if (action.type === actionTypes.FINISH_DROP) {
        if (keepBackpack.length > 4) return state;

        const nextState = {
          ...state,
          loot: null,
          duplicatedLoot: null,
        };

        const keepBackpackSorted = keepBackpack.slice();
        keepBackpackSorted.sort();

        const newBackpack = [];

        for (const index of keepBackpackSorted) {
          if (index < 4) {
            newBackpack.push(backpack[index]);
          } else {
            newBackpack.push(loot);
          }
        }
        while (newBackpack.length < 4) {
          newBackpack.push(null);
        }

        nextState.backpack = newBackpack;

        const haveNextRoom = !room.next.every(item => item == null);
        if (haveNextRoom) {
          nextState.phase = 'move';
        } else {
          nextState.phase = 'endScreen';
        }

        return nextState;
      }
      return state;
    }


    case 'move': {
      if (action.type === actionTypes.MOVE) {
        const { nextID, dir } = action;
        const { map, roomID, roomHistory, monster } = state;
        const nextRoom = map.nodes[nextID];
        if (!nextRoom) return state;

        console.log(`Move: ${roomID} ${['L', 'M', 'R'][dir]}`);

        const nextState = {
          ...state,
          roomID: nextID,
          depth: state.depth + 1,
          roomHistory: [...roomHistory, { roomID, monster: monster.icon, dir }],
        };

        nextState.phase = 'roomStart';
        nextState.pauseFor = 2000;


        return nextState;
      }

      return state;
    }

    default: {


      return state;
    }
  }

};

function App() {
  console.log('Rerender');
  const [playerName, setPlayerName] = useLocalStorage('dickson.md/depth-first-dungeon/player_name', 'Player');
  const [gameSeed, setGameSeed] = useLocalStorage('dickson.md/depth-first-dungeon/game_seed', 'LD-48');
  const [gameDepth, setGameDepth] = useLocalStorage('dickson.md/depth-first-dungeon/game_depth', 12);
  const [officialGame, setOfficialGame] = useLocalStorage('dickson.md/depth-first-dungeon/official_game', null);
  const [url, setUrl] = useLocalStorage('dickson.md/depth-first-dungeon/official_game_url', null);
  const [isCheat] = useLocalStorage('dickson.md/depth-first-dungeon/dev_mode', false);
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    console.log('scrollToBottom');
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }


  if (url === null) {
    setUrl('https://gist.githubusercontent.com/vicksonzero/18d570c8180e9c9165430cf4073a4ce2/raw/2472a3655427fa31d4b6de12154d0481c2484e7e/tree-dungeon-seed.json');
  }

  useEffect(() => {
    (async () => {
      const results = await (await fetch(url)).json();
      console.log('Official', results);
      setOfficialGame(results);
    })();
  }, [url]);

  const applyOfficialGame = () => {
    if (officialGame != null) {
      setGameSeed(officialGame.game_seed);
      setGameDepth(officialGame.game_depth);
    }
  };

  const [gameState, doGameAction] = React.useReducer(gameStateReducer, { ...initialState, isCheat });

  const {
    depth,
    roomID,
    player,
    monster,
    phase,
    turn,
    backpack,
    loot,
    duplicatedLoot,
    map,
    roomHistory,
    keepBackpack,
    pauseFor,
    fightLogs,
  } = gameState;

  window.map = map;

  useEffect(() => {
    if (pauseFor <= 0) return;
    const time = uniqID++;
    console.log(`Wait: ${pauseFor} ${time}`);
    const timer = setTimeout(() => {
      doGameAction({ type: actionTypes.TICK, time })
    }, pauseFor);

    return () => clearTimeout(timer);
  });
  useEffect(() => {
    scrollToBottom()
  }, [fightLogs]);

  const room = map.nodes[roomID];


  const mainScreen = (() => {
    switch (phase) {
      case 'titleScreen': {
        return (
          <div className={styles.center}>
            <div>
              <h1>Depth-First-Dungeon</h1>
              <p>
                Venture deep into this underground dungeon and uncover the one treasure at the very bottom.
              </p>
              <div>
                <div><label>Name: <input type="text" value={playerName} onChange={(event) => setPlayerName(event.target.value)} /></label></div>
                <div><label>Seed: <input type="text" value={gameSeed} onChange={(event) => setGameSeed(event.target.value)} maxLength={20} /></label></div>
                <div><label>Depth: <input type="text" value={gameDepth} onChange={(event) => setGameDepth(event.target.value)} /></label></div>
              </div>
              <p>
                Official seed: {officialGame ? `["${officialGame.game_seed}", ${officialGame.game_depth}]` : 'Loading...'} <br />
                <button onClick={() => applyOfficialGame()}>Use official seed</button>
              </p>
              <p>
                <button onClick={() => doGameAction({ type: actionTypes.START_GAME, gameSeed, gameDepth, playerName })}>Game Start!</button>
              </p>
            </div>
          </div>
        );
      }

      case 'endScreen': {
        const historyStrList = roomHistory.map(({ roomID, monster, dir }) => `R${roomID} ${monster} ${['L', 'M', 'R'][dir]}`);
        const msg = (() => {
          if (depth === 10) {
            return 'You have reached the very depth';
          } else {
            return `You have reached the end of a journey, but did not find the great treasure at depth ${gameDepth}`;
          }
        })();

        return (
          <div>
            <h1>Congratulations!</h1>
            <p>{msg}</p>
            <p>Seed: <code>{gameSeed}</code></p>
            <p>Your Journey: {historyStrList.join('→ ')}→ R{roomID} {monster.icon} ⭐</p>

          </div>
        );
      }

      case 'gameOver': {
        const historyStrList = roomHistory.map(({ roomID, monster, dir }) => `R${roomID} ${monster} ${['L', 'M', 'R'][dir]}`);
        const msg = <>You have been defeated. <br />You miraculously respawn at the entrance, but all of your items are gone.</>;

        return (
          <div>
            <h1>Game Over!</h1>
            <p>{msg}</p>
            <p>Seed: <code>{gameSeed}</code></p>
            <p>Your Journey: {historyStrList.join('→ ')}→ R{roomID} {monster.icon} → 💀</p>

          </div>
        );
      }

      case 'roomStart': {
        const historyStrList = roomHistory.map(({ roomID, monster, dir }) => `R${roomID} ${monster} ${['L', 'M', 'R'][dir]}`);
        return (
          <div className={styles.center}>
            <div style={{ textAlign: 'center' }}>{[...historyStrList, ''].join('→ ')}</div>
            <h1 style={{ textAlign: 'center' }}>Room {roomID}</h1>
          </div>
        );
      }

      case 'fight': {
        if (!monster) return <></>;
        const { name, icon, hp, maxHp } = monster;
        const monsterHpPercent = hp / maxHp * 100;
        const playerHpPercent = player.hp / player.maxHp * 100;
        return (
          <>
            <h1>Encounter</h1>
            <div className={`${styles.fightLogs}`}>
              <ul>
                {fightLogs.map(log => <li>{log}</li>)}
                <div ref={messagesEndRef} />
              </ul>
            </div>
            <div className={styles.fightScreen}>
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '30%', textAlign: 'center' }}>
                      <div className={styles.fightIcon}>{icon}</div>
                      <h3>{capitalize(name)}</h3>
                    </td>
                    <td style={{ width: '70%' }}>
                      <div className={''}>HP: {Math.floor(monsterHpPercent)}%</div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ width: '30%', textAlign: 'center' }}>
                      <div className={styles.fightIcon}>🤠</div>
                      <h3>{player.name}</h3>
                    </td>
                    <td style={{ width: '70%' }}>
                      <div className={''}>HP: {player.hp}/{player.maxHp}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        );
      }

      case 'item': {
        console.log('mainScreen:item', keepBackpack);
        const lootStr = (() => {
          if (loot) {
            return <span style={{ color: 'orange' }}>{capitalize(loot.name)} ({loot.uses < 0 ? 'Equipment' : (loot.uses < 100 ? loot.uses : '99+')})</span>
          } else if (duplicatedLoot) {
            return <>
              {'another '}
              <span style={{ color: 'orange' }}>{capitalize(duplicatedLoot.name)} ({duplicatedLoot.uses < 100 ? duplicatedLoot.uses : '99+'})</span>
            </>
          } else {
            return 'nothing'
          }
        })();

        const actionLabel = (() => {
          if (keepBackpack.length <= 4) {
            return `Proceed with ${keepBackpack.length} / 4 items`;
          } else {
            return `Backpack is too full (${keepBackpack.length} / 4)`;
          }
        })();
        return (
          <>
            <div>
              <h1>Loot</h1>
              <p>You have found {lootStr} in this room!</p>
              {keepBackpack.length <= 4 ? null : <p>You must drop items until you only have 4 on hand.</p>}
              <p>
                <button onClick={() => doGameAction({ type: actionTypes.FINISH_DROP })} disabled={keepBackpack.length > 4}>{actionLabel}</button>
              </p>
              <table style={{ borderCollapse: 'collapse' }}>

                <thead>
                  <tr className={styles.dropItemRow}>
                    <td className={`${styles.dropItemCell} ${styles.dropItemCellHeader} ${styles.dropItemIconCell}`}>
                      Item
                    </td>
                    <td className={`${styles.dropItemCell} ${styles.dropItemCellHeader} ${styles.dropItemDescriptionCell}`}>
                      Descriptions / Effects
                    </td>
                    <td className={`${styles.dropItemCell} ${styles.dropItemCellHeader} ${styles.dropItemRowDropCell}`}>
                      Keep?
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (!loot) return null;
                    const { name, icon, descriptions, effects, uses } = loot;
                    const lootID = 4;
                    const isKeeping = keepBackpack.includes(lootID);
                    const dropStyle = isKeeping ? '' : styles.dropItemRowDrop;

                    const usesStr = uses < 0 ? 'Equipment' : (uses < 100 ? uses : '99+');
                    return <tr className={`${styles.dropItemRow} ${styles.dropItemRowLoot} ${dropStyle}`}>
                      <td className={`${styles.dropItemCell} ${styles.dropItemIconCell}`}>
                        <span className={styles.itemButtonIcon}>{icon}</span><br />
                        <span>{capitalize(name)} ({usesStr})</span><br />
                        <span>(New item)</span>
                      </td>
                      <td className={`${styles.dropItemCell} ${styles.dropItemDescriptionCell}`}>
                        <p>{descriptions}</p>
                        <ul>
                          {effects.map(effect => {
                            return <li>{effectToString(effect)}</li>
                          })}
                        </ul>
                      </td>
                      <td className={`${styles.dropItemCell} ${styles.dropItemRowDropCell}`}>
                        {isKeeping ? <button onClick={() => doGameAction({ type: actionTypes.DROP_ITEM, backpackID: 4 })}>Drop</button> :
                          <button onClick={() => doGameAction({ type: actionTypes.KEEP_ITEM, backpackID: 4 })}>Keep</button>}
                      </td>
                    </tr>
                  })()}
                  {backpack.map((item, i) => {
                    if (!item) return <tr></tr>
                    const { name, icon, descriptions, effects, uses } = item;
                    const isKeeping = keepBackpack.includes(i);
                    const dropStyle = isKeeping ? '' : styles.dropItemRowDrop;

                    const usesStr = uses < 0 ? 'Equipment' : (uses < 100 ? uses : '99+');
                    return <tr className={`${styles.dropItemRow} ${dropStyle}`}>
                      <td className={`${styles.dropItemCell} ${styles.dropItemIconCell}`}>
                        <span className={styles.itemButtonIcon}>{icon}</span><br />
                        <span>{capitalize(name)} ({usesStr})</span>
                      </td>
                      <td className={`${styles.dropItemCell} ${styles.dropItemDescriptionCell}`}>
                        <p>{descriptions}</p>
                        <ul>
                          {effects.map(effect => {
                            return <li>{effectToString(effect)}</li>
                          })}
                        </ul>
                      </td>
                      <td className={`${styles.dropItemCell} ${styles.dropItemRowDropCell}`}>
                        {isKeeping ? <button onClick={() => doGameAction({ type: actionTypes.DROP_ITEM, backpackID: i })}>Drop</button> :
                          <button onClick={() => doGameAction({ type: actionTypes.KEEP_ITEM, backpackID: i })}>Keep</button>}
                      </td>
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
          </>
        );
      }

      case 'move': {
        return (
          <>
            <h1>
              Choose a hole and jump into it
            </h1>
            <div className={styles.moveChoicesContainer}>
              {room.next.map((nextID, i) => (
                <div className={styles.moveItemButton} onClick={() => doGameAction({ type: actionTypes.MOVE, nextID, dir: i })}>
                  {nextID ? <>{['Left', 'Middle', 'Right'][i]}<br /><span className={styles.itemButtonIcon}>🕳️</span></> : ''}
                </div>
              ))}
            </div>
          </>
        );
      }
      default:
    }
  })();

  const historyStrList = roomHistory.map(({ roomID, monster, dir }) => `R${roomID} ${monster} ${['L', 'M', 'R'][dir]}`);
  const roomBar = roomID < 0 ? <></> :
    <>
      <span className={styles.roomBarDepthLabel}>Depth: {depth}</span>
      <span className={styles.roomBarRoomsLabel}>Rooms: {historyStrList.join('→ ')}→ R{roomID}</span>
    </>

  const playerBar = <>
    <span className={styles.playerBarItem}>{player.name}</span>
    <span className={styles.playerBarItem}>{player.hp}/{player.maxHp}</span>
    <span className={styles.playerBarItem}></span>
  </>

  const itemBar = backpack.map((item, i) => {
    const isButtonEnabled = (phase === 'item' || (phase === 'fight' && turn === 'player'));
    const buttonStateClass = isButtonEnabled ? styles.itemButtonEnabled : styles.itemButtonDisabled;
    const buttonStateClassEmpty = isButtonEnabled ? '' : styles.itemButtonDisabled;

    if (!item) {
      return <div className={`${styles.itemButton} ${buttonStateClassEmpty}`}>
      </div>
    }

    const { name, icon, uses } = item;
    const usesStr = uses < 0 ? 'Equipment' : (uses < 100 ? uses : '99+');
    return <div
      className={`${styles.itemButton} ${buttonStateClass}`}
      onClick={() => doGameAction({ type: actionTypes.USE_ITEM, backpackSlotID: i })}
    >
      <span className={styles.itemButtonIcon}>{icon}</span>
      <span>{name} ({usesStr})</span>
    </div>
  });





  return (
    <div className={styles.container}>
      <div className={styles.roomBar}>{roomBar}</div>
      <div className={styles.main}>
        {mainScreen}
      </div>
      <div className={styles.playerBar}>{playerBar}</div>
      {phase === 'item' ? null : <div className={styles.itemBar}>{itemBar}</div>}
    </div>
  );
}

export default App;
