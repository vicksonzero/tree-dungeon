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
    name: 'Dagger',
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
    name: 'Dagger +1',
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
      weight: 5,
      name: 'dagger +1',
      uses: 1000,
    },
    {
      weight: 4,
      name: 'apple',
      uses: 1,
    },
    {
      weight: 1,
      name: 'hammer',
      uses: 1,
    },
  ],
  [ // 2
    {
      weight: 10,
      name: 'hamburger',
      uses: 7,
    },
    {
      weight: 5,
      name: 'dagger +1',
      uses: 1000,
    },
    {
      weight: 4,
      name: 'apple',
      uses: 1,
    },
    {
      weight: 2,
      name: 'sword',
      uses: 1,
    },
  ]
]

export function getItem(name) {
  return items[name];
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

export function effectToString(effectDef) {
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

    case 'footprint': {
      return `Leave footprints on the floor`;
    }

    default:
      console.warn(`Unknown effect type ${effectDef.type}`);
  }
}