
import * as seedrandom from 'seedrandom';
import { weightedGetMonster } from './monsters';



const manualMap = {
    nodes: [
        {
            // 0
            monster: {
                name: 'rat',
                lv: 1,
            },
            loot: null,
            next: [
                null, 1, null,
            ]
        },
        {
            // 1
            monster: {
                name: 'rat',
                lv: 1,
            },
            loot: null,
            next: [
                null, 2, 3,
            ]
        },
        {
            // 2
            monster: {
                name: 'crab',
                lv: 1,
            },
            loot: null,
            next: [
                null, null, null,
            ]
        },
        {
            // 3
            monster: null,
            loot: null,
            next: [
                null, null, null,
            ]
        },
        {
            // 4
            monster: null,
            loot: null,
            next: [
                null, null, null,
            ]
        },
        {
            // 5
            monster: null,
            loot: null,
            next: [
                null, null, null,
            ]
        },
    ]
};

export function generateMap(seed = 'LD48', depth = 2, prongs = 3) {
    const rng = seedrandom(seed);
    const result = [
        {
            index: 0,
            monster: {
                name: 'rat',
                lv: 1,
            },
            loot: { itemTier: 0 },
            depth: 0,
            next: new Array(prongs).fill(1).map(_ => null),
        },
    ];

    let largestDepth = 0;

    while (largestDepth < depth) {
        let randomIndex, hasSpaceForNext, nextCandidates;

        for (let i = 0; i < 20 && !hasSpaceForNext; i++) {
            randomIndex = Math.floor(rng() * result.length);

            const node = result[randomIndex];

            nextCandidates = [];
            for (let j = 0; j < node.next.length; j++) {
                if (node.next[j] == null) nextCandidates.push(j);
            }
            hasSpaceForNext = nextCandidates.length > 0;
        }
        const parentIndex = randomIndex;
        const parentNode = result[parentIndex];

        const newIndex = result.length;

        const itemTier = Math.floor(parentNode.depth + 1 / 5);
        result.push({
            index: newIndex,
            monster: {
                name: weightedGetMonster(itemTier, rng).name,
            },
            loot: rng() > 0.5 ? null : { itemTier },
            depth: parentNode.depth + 1,
            next: new Array(prongs).fill(1).map(_ => null),
        });

        largestDepth = Math.max(largestDepth, parentNode.depth + 1);


        const nextID = nextCandidates[Math.floor(rng() * nextCandidates.length)];
        parentNode.next[nextID] = newIndex;
        console.log(`created node ${newIndex} with parent ${parentIndex} going ${['left', 'middle', 'right'][nextID]}. largestDepth=${largestDepth}`);
    }

    return traverse(result, 0);
}


export function traverse(nodeList, nodeID) {
    console.log('traverse', nodeID);
    const node = nodeList[nodeID];
    node.parent = node.parent ?? null;
    node.depth = node.depth ?? 0;
    node.traverseIndex = node.traverseIndex ?? 0;

    let traverseIndex = node.traverseIndex + 1;
    const childrenID = node.next;
    for (const childID of childrenID) {
        const child = nodeList[childID];
        if (!child) continue;
        child.parent = nodeID;
        child.depth = node.depth + 1;
        child.traverseIndex = traverseIndex++;

        traverse(nodeList, childID);
    }

    return nodeList;
}

traverse(manualMap.nodes, 0);

export const map = {
    nodes: generateMap(3, 3),
};