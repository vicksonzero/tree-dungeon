const items = {
  'hamburger': {
    name: 'hamburger',
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
    name: 'apple',
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
  'dagger': {
    name: 'dagger',
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
    name: 'dagger +1',
    icon: '🔪',
    uses: 1000,
    descriptions: 'Trusty old dagger to at least fend off small animals',
    effects: [
      {
        type: 'dmg',
        amount: 5,
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
      weight: 4,
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
      uses: 5,
    },
    {
      weight: 4,
      name: 'apple',
      uses: 1,
    },
    {
      weight: 5,
      name: 'dagger',
      uses: 1000,
    },
    {
      weight: 2,
      name: 'dagger +1',
      uses: 1000,
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

export function doEffect(effectDef, me, them) {
  console.log(`doEffect (${effectDef.type})`);
  const result = { me, them };

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
    }

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

    default:
      console.warn(`Unknown effect type ${effectDef.type}`);
  }
}