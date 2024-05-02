/*

https://sheets.googleapis.com/v4/spreadsheets/1HMo8-CXJ1Q3MNE7A0f9fAcCU4qVStaoimO4AnVdZN-g/values/monsters_table!A1%3AG30?key=AIzaSyAD6mJHZtU3ijA1eMVQl-HHuYiBLyCJaqY
https://sheets.googleapis.com/v4/spreadsheets/1HMo8-CXJ1Q3MNE7A0f9fAcCU4qVStaoimO4AnVdZN-g/values/cards_table!A1%3AG30?key=AIzaSyAD6mJHZtU3ijA1eMVQl-HHuYiBLyCJaqY
https://sheets.googleapis.com/v4/spreadsheets/1HMo8-CXJ1Q3MNE7A0f9fAcCU4qVStaoimO4AnVdZN-g/values/monsters!A1%3AG30?key=AIzaSyAD6mJHZtU3ijA1eMVQl-HHuYiBLyCJaqY
https://sheets.googleapis.com/v4/spreadsheets/1HMo8-CXJ1Q3MNE7A0f9fAcCU4qVStaoimO4AnVdZN-g/values/cards!A1%3AG30?key=AIzaSyAD6mJHZtU3ijA1eMVQl-HHuYiBLyCJaqY
https://sheets.googleapis.com/v4/spreadsheets/1HMo8-CXJ1Q3MNE7A0f9fAcCU4qVStaoimO4AnVdZN-g/values/effects!A1%3AG30?key=AIzaSyAD6mJHZtU3ijA1eMVQl-HHuYiBLyCJaqY

*/

const items = {
  'hamburger': {
    name: 'Hamburger',
    icon: '🍔',
    uses: 5,
    descriptions: 'Yummy burger to restore some health. Still edible?!',
    effects: [
      {
        type: 'heal',
        amount: 2,
      }
    ]
  },
  'rice': {
    name: 'Rice Ball',
    icon: '🍙',
    uses: 3,
    descriptions: 'Hearty packed lunch with soothing stuffings in it',
    effects: [
      {
        type: 'heal',
        amount: 6,
      }
    ]
  },
  'apple': {
    name: 'Apple',
    icon: '🍎',
    uses: 1,
    descriptions: 'Juicy Apple to boost your max health',
    effects: [
      {
        type: 'addHp',
        amount: 2,
      }
    ]
  },
  'shoes': {
    name: 'Leather Shoes',
    icon: '👞',
    uses: -1, // equipment
    descriptions: 'An item for formal dressing. At least it is good for leaving footprints',
    effects: [
      {
        type: 'footprints',
      }
    ]
  },
  'dagger': {
    name: 'Broken Dagger',
    icon: '🔪',
    uses: 1000,
    descriptions: 'Trusty old dagger to at least fend off small animals',
    effects: [
      {
        type: 'dmg',
        amount: 2,
      }
    ]
  },
  'dagger +1': {
    name: 'Actual Dagger',
    icon: '🔪',
    uses: 1000,
    descriptions: 'A better dagger for self defense',
    effects: [
      {
        type: 'dmg',
        amount: 5,
      }
    ]
  },
  'sword': {
    name: 'Sword',
    icon: '🗡',
    uses: 50,
    descriptions: 'A proper sword',
    effects: [
      {
        type: 'dmg',
        amount: 10,
      },
    ]
  },
  'hammer': {
    name: 'Hammer of Binding',
    icon: '🔨',
    uses: 1,
    descriptions: 'Combines two random items into one',
    effects: [
      {
        type: 'combine',
      }
    ]
  },
  'dynamite': {
    name: 'Parting Gift',
    icon: '🧨',
    uses: -1,
    descriptions: 'Curse every monster you have killed',
    effects: [
      {
        type: 'partingCurse',
      }
    ]
  },
  'dice': {
    name: 'Loaded Dice',
    icon: '🎲',
    uses: 1,
    descriptions: 'Nudge luck towards your side',
    effects: [
      {
        type: 'dice',
      }
    ]
  },
};


const lootTables = [
  [ // 0
    {
      weight: 10,
      name: 'hamburger',
      uses: 5,
    },
    {
      weight: 5,
      name: 'apple',
      uses: 1,
    },
    {
      weight: 2,
      name: 'dagger',
      uses: 1000,
    },
  ],
  [ // 1
    {
      weight: 10,
      name: 'hamburger',
      uses: 7,
    },
    {
      weight: 10,
      name: 'dagger +1',
      uses: 1000,
    },
    {
      weight: 10,
      name: 'apple',
      uses: 1,
    },
    {
      weight: 5,
      name: 'rice',
      uses: 3,
    },
    {
      weight: 4,
      name: 'hammer',
      uses: 1,
    },
    {
      weight: 1,
      name: 'dice',
      uses: 1,
    },
  ],
  [ // 2
    {
      weight: 4,
      name: 'hamburger',
      uses: 7,
    },
    {
      weight: 3,
      name: 'dagger +1',
      uses: 1000,
    },
    {
      weight: 8,
      name: 'apple',
      uses: 1,
    },
    {
      weight: 9,
      name: 'rice',
      uses: 3,
    },
    {
      weight: 4,
      name: 'sword',
      uses: 1,
    },
    {
      weight: 2,
      name: 'dynamite',
      uses: -1,
    },
    {
      weight: 1,
      name: 'dice',
      uses: 1,
    },
  ]
]

export function getItem(name) {
  return { ...items[name] };
}

export function weightedGetItem(tier, rng) {
  // // debug
  // return { ...getItem('hamburger'), uses: 5 };


  let lootTable = lootTables[tier];
  if (!lootTable) lootTable = lootTables[lootTables.length - 1];

  let totalWeight = 0;
  const weightedLootTable = [];
  for (const item of lootTable) {
    weightedLootTable.push({ w: totalWeight + item.weight, item });
    totalWeight += item.weight;
  }

  const roll = rng() * totalWeight;

  for (const { w, item } of weightedLootTable) {
    if (roll < w) {
      console.log(`weightedGetItem: roll=${Math.floor(roll)}/${totalWeight}, item=${item.name}`);
      return { ...getItem(item.name), uses: item.uses };
    };
  }
}

export function onLeaveRoom(effectDef, roomID, nextRoomID, map, footprints, partingCurse) {
  console.log(`onLeaveRoom (${effectDef.type})`);
  const result = { footprints, partingCurse };

  switch (effectDef.type) {

    case 'footprints': {
      result.footprints = [...footprints];
      result.footprints.push(nextRoomID);
    } break;

    case 'partingCurse': {
      result.partingCurse = [...partingCurse];
      result.partingCurse.push(roomID);
    } break;

    default:
  }

  return result;
}

export function doEffect(effectDef, me, them, fightLogs, backpack) {
  console.log(`doEffect (${effectDef.type})`);
  const result = { me, them, fightLogs, backpack };

  switch (effectDef.type) {
    case 'dmg': {
      result.them = { ...them };
      result.them.hp -= effectDef.amount;
    } break;

    case 'heal': {
      result.me = { ...me };
      result.me.hp += effectDef.amount;
      result.me.hp = Math.min(result.me.hp, result.me.maxHp);
    } break;

    case 'addHp': {
      result.me = { ...me };
      result.me.maxHp += effectDef.amount;
      result.me.hp += effectDef.amount;
      result.me.hp = Math.min(result.me.hp, result.me.maxHp);
    } break;

    case 'echo': {
      console.log(effectDef.message);
      result.fightLogs = [...fightLogs];
      result.fightLogs.push(<>It says <span style={{ color: 'orange' }}>{effectDef.message}</span></>);
    } break;

    case 'combine': {
      result.backpack = [...backpack];
    } break;

    default:
      console.warn(`Unhandled effect ${effectDef.type}`);
  }

  return result;
}

export function effectToString(effectDef, state) {
  switch (effectDef.type) {
    case 'dmg': {
      return `Deal ${effectDef.amount} damage`;
    }

    case 'heal': {
      return `Heal for ${effectDef.amount}`;
    }

    case 'addHp': {
      return `Add ${effectDef.amount} to maximum health`;
    }

    case 'echo': {
      return `Say a message`;
    }

    case 'footprints': {
      const { footprints } = state;
      return `Leave footprints on the floor (${footprints.length} left)`;
    }

    case 'partingCurse': {
      const { partingCurse } = state;
      return `Curse monsters you have killed (${partingCurse.length} cursed)`;
    }

    case 'dice': {
      const diceShift = 1 - Math.pow(0.9, effectDef.uses);
      return `Dice is ${Math.floor(diceShift * 100)}% biased`;
    }

    default:
      console.warn(`Unknown effect type ${effectDef.type}`);
  }
}