const monsters = {
  rat: {
    name: 'Rat',
    icon: '🐀',
    hp: 10,
    maxHp: 10,
    aggro: 0.5,
    attack: {
      name: 'Scratch',
      effects: [
        {
          type: 'dmg',
          amount: 1,
        }
      ]
    },
  },
  crab: {
    name: 'Crab',
    icon: '🦀',
    hp: 20,
    maxHp: 20,
    aggro: 0.3,
    attack: {
      name: 'Pinch',
      effects: [
        {
          type: 'dmg',
          amount: 1,
        }
      ]
    },
  },
  wolf: {
    name: 'Wolf',
    icon: '🐺',
    hp: 20,
    maxHp: 20,
    aggro: 0.8,
    attack: {
      name: 'Scratch',
      effects: [
        {
          type: 'dmg',
          amount: 1,
        }
      ]
    },
  },
};


const monsterTables = [
  [ // 0
    {
      weight: 10,
      name: 'rat',
    },
    {
      weight: 5,
      name: 'crab',
    },
    {
      weight: 1,
      name: 'wolf',
    },
  ],
  [ // 1
    {
      weight: 4,
      name: 'rat',
    },
    {
      weight: 8,
      name: 'crab',
    },
    {
      weight: 3,
      name: 'wolf',
    },
  ],
  [ // 2
    {
      weight: 2,
      name: 'rat',
    },
    {
      weight: 5,
      name: 'crab',
    },
    {
      weight: 8,
      name: 'wolf',
    },
  ],
]


export function weightedGetMonster(tier, rng) {
  // // debug
  // return { ...getItem('rat') };


  let monsterTable = monsterTables[tier];
  if (!monsterTable) monsterTable = monsterTables[monsterTables.length - 1];

  let totalWeight = 0;
  const weightedMonsterTable = [];
  for (const monster of monsterTable) {
    weightedMonsterTable.push({ w: totalWeight + monster.weight, monster });
    totalWeight += monster.weight;
  }

  const roll = rng() * totalWeight;

  for (const { w, monster } of weightedMonsterTable) {
    if (roll < w) {
      console.log(`weightedGetMonster: roll=${Math.floor(roll)}/${totalWeight}, monster=${monster.name}`);
      return { name: monster.name };
    };
  }
}

export function getMonster(name) {
  return { ...monsters[name] };
}