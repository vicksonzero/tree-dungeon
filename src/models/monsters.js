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
        hp: 30,
        maxHp: 30,
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
        aggro: 0.9,
        attack: {
            name: 'Pinch',
            effects: [
                {
                    type: 'dmg',
                    amount: 2,
                }
            ]
        },
    },
};

export function getMonster(name, lv) {
    return monsters[name];
}