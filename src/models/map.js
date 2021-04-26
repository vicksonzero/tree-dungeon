
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

export function getSize(nodeList, nodeID) {
    // console.log('traverse', nodeID);
    const node = nodeList[nodeID];

    if (node.width) return node.width;

    const childrenID = node.next;
    if (childrenID[0] == null && childrenID[1] == null && childrenID[2] == null) {
        node.width = [0, 0];
        return [0, 0];
    }

    const leftWidth = node.next[0] == null ? [0, 0] : getSize(nodeList, node.next[0]);
    const middleWidth = node.next[1] == null ? [0, 0] : getSize(nodeList, node.next[1]);
    const rightWidth = node.next[2] == null ? [0, 0] : getSize(nodeList, node.next[2]);


    node.width = [
        (node.next[0] == null ? 0 : (leftWidth[0] + 1 + leftWidth[1])) + middleWidth[0],
        (node.next[2] == null ? 0 : (rightWidth[0] + 1 + rightWidth[1])) + middleWidth[1]
    ];

    return node.width;
}

export function drawMap(nodeList, mapDepth = 2) {
    const graphWidth = getSize(nodeList, 0);
    console.log('drawMap');
    console.log(graphWidth);
    const result = new Array((mapDepth + 1) * 2).fill(1).map(_ => new Array(graphWidth[0] + 1 + graphWidth[1] + 2).fill(' '));

    const queue = [];
    const parentX = nodeList[0].width[0] + 1;
    result[0][parentX] = 'O';
    nodeList[0].x = parentX;

    for (const childNodeID of nodeList[0].next) {
        if (childNodeID != null) queue.push(childNodeID);
    }
    while (queue.length) {
        const nodeID = queue[0];
        const node = nodeList[nodeID];
        const parentX = nodeList[node.parent].x;
        const parentWidth = nodeList[node.parent].width;
        const { depth, width, next } = node;
        const parentNode = nodeList[node.parent];
        const dir = parentNode.next.indexOf(nodeID);
        const armWidth = [-parentWidth[0] + width[0], 0, parentWidth[1] - width[1]][dir];
        const x = parentX + armWidth;
        // console.log('plotting at', depth, x, 'node=', nodeID, 'parent=', node.parent, ['L', 'M', 'R'][dir]);
        if (result[depth * 2][x] !== ' ') {
            debugger;
            throw new Error('Place is taken');
        }
        result[depth * 2][x] = (next.every(n => n == null) ? (depth === mapDepth ? '*' : 'X') : ('' + nodeID).slice(-1));
        result[depth * 2 - 1][x] = ['/', '|', '\\'][dir];
        node.x = x;

        if (Math.abs(armWidth) > 1) {
            for (let i = 1; i < Math.abs(armWidth); i++) {
                result[depth * 2 - 2][parentX + [-1, 0, 1][dir] * i] = '_';
            }
        }

        // debugger;
        for (const childNodeID of node.next) {
            if (childNodeID != null) queue.push(childNodeID);
        }

        queue.shift();
    }

    console.log('drawMap result');
    console.log(result.map((line, i) => ('' + Math.floor((i + 1) / 2)).padStart(2, ' ') + '  ' + line.join('')).join('\n'));
}

export function generateMap(seed = 'LD48', depth = 2, prongs = 3) {
    const reduce3Prongs = 0.5;
    const rng = seedrandom(seed);
    const tutorialRooms = [0, 1];
    const result = [
        {
            index: 0,
            monster: {
                name: 'rat',
                lv: 1,
            },
            loot: { name: 'hamburger', uses: 5 },
            depth: 0,
            next: [null, 1, null],
        },
        {
            index: 1,
            monster: {
                name: 'rat',
                lv: 1,
            },
            loot: { name: 'shoes', uses: -1 },
            depth: 1,
            next: [null, 2, null],
        },
        {
            index: 2,
            monster: {
                name: 'rat',
                lv: 1,
            },
            loot: { itemTier: 0 },
            depth: 2,
            next: new Array(prongs).fill(1).map(_ => null),
        },
    ];

    let largestDepth = 0;
    let maxTries = 0;
    while (largestDepth < depth) {
        let randomIndex, hasSpaceForNext, nextCandidates;
        let i;

        for (i = 0; i < 2000 && !hasSpaceForNext; i++) {
            randomIndex = Math.floor(rng() * result.length);
            if (tutorialRooms.includes(randomIndex)) continue;

            const do3Prongs = rng() > reduce3Prongs;
            const node = result[randomIndex];

            nextCandidates = [];
            for (let j = 0; j < node.next.length; j++) {
                if (node.next[j] == null) nextCandidates.push(j);
            }
            hasSpaceForNext = (do3Prongs ? nextCandidates.length >= 1 : nextCandidates.length >= 2);
        }
        maxTries = Math.max(maxTries, i);

        if (!hasSpaceForNext) {
            throw new Error('Map generation: Could not find space to add new nodes');
        }
        const parentIndex = randomIndex;
        const parentNode = result[parentIndex];

        const newIndex = result.length;

        const itemTier = Math.floor((parentNode.depth + 1) / 4);
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


        const nextID = (nextCandidates.includes(1) ? 1 : nextCandidates[Math.floor(rng() * nextCandidates.length)]);
        parentNode.next[nextID] = newIndex;
        console.log(`created node ${newIndex} with parent ${parentIndex} going ${['left', 'middle', 'right'][nextID]}. largestDepth=${largestDepth}`);
    }
    console.log('maxTries', maxTries);

    return traverse(result, 0);
}


export function traverse(nodeList, nodeID) {
    // console.log('traverse', nodeID);
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