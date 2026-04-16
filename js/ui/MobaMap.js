/**
 * MobaMap — 简化MOBA地图SVG组件
 * 展示三路兵线推进度、防御塔状态、野区目标
 */

const W = 320, H = 300;
const TOWER_R = 5;

const LANE_PATHS = {
    top: { start: [40, 260], mid: [40, 40], end: [280, 40] },
    mid: { start: [60, 260], mid: [160, 150], end: [260, 40] },
    bot: { start: [80, 260], mid: [280, 260], end: [280, 40] },
};

const MY_BASE = [30, 275];
const EN_BASE = [290, 25];

const TOWER_POS = {
    top: {
        my: [[50, 210], [50, 130]],
        enemy: [[100, 45], [200, 45]],
    },
    mid: {
        my: [[90, 225], [120, 195]],
        enemy: [[200, 105], [230, 75]],
    },
    bot: {
        my: [[130, 270], [210, 270]],
        enemy: [[275, 130], [275, 80]],
    },
};

const OBJ_POS = {
    baron: [100, 130],
    lord: [220, 170],
};

export function createMobaMapSVG(lanes, opts = {}) {
    const baronAlive = opts.baronAlive || false;
    const lordAlive = opts.lordAlive || false;

    let svg = `<svg viewBox="0 0 ${W} ${H}" class="moba-map" xmlns="http://www.w3.org/2000/svg">`;

    // 背景
    svg += `<defs>
        <radialGradient id="mg-base-my"><stop offset="0%" stop-color="#2a9d8f33"/><stop offset="100%" stop-color="transparent"/></radialGradient>
        <radialGradient id="mg-base-en"><stop offset="0%" stop-color="#e74c3c33"/><stop offset="100%" stop-color="transparent"/></radialGradient>
        <linearGradient id="mg-lane-my" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#2a9d8f"/><stop offset="100%" stop-color="#2a9d8f00"/></linearGradient>
        <linearGradient id="mg-lane-en" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#e74c3c00"/><stop offset="100%" stop-color="#e74c3c"/></linearGradient>
    </defs>`;

    // 地图背景区域
    svg += `<rect width="${W}" height="${H}" rx="8" fill="#0d1b2a" stroke="#1a2235" stroke-width="1"/>`;

    // 基地
    svg += `<circle cx="${MY_BASE[0]}" cy="${MY_BASE[1]}" r="18" fill="url(#mg-base-my)" stroke="#2a9d8f" stroke-width="1.5"/>`;
    svg += `<text x="${MY_BASE[0]}" y="${MY_BASE[1] + 3}" text-anchor="middle" fill="#2a9d8f" font-size="8" font-weight="700">基地</text>`;
    svg += `<circle cx="${EN_BASE[0]}" cy="${EN_BASE[1]}" r="18" fill="url(#mg-base-en)" stroke="#e74c3c" stroke-width="1.5"/>`;
    svg += `<text x="${EN_BASE[0]}" y="${EN_BASE[1] + 3}" text-anchor="middle" fill="#e74c3c" font-size="8" font-weight="700">基地</text>`;

    // 路线
    for (const [lane, path] of Object.entries(LANE_PATHS)) {
        const { start, mid, end } = path;
        const d = `M${start[0]},${start[1]} Q${mid[0]},${mid[1]} ${end[0]},${end[1]}`;
        svg += `<path d="${d}" fill="none" stroke="#1a2235" stroke-width="8" stroke-linecap="round"/>`;

        // 推进度指示
        const laneData = lanes[lane];
        if (laneData) {
            const progress = laneData.progress / 100;
            svg += `<path d="${d}" fill="none" stroke="#2a9d8f" stroke-width="4" stroke-linecap="round" 
                stroke-dasharray="${534 * (1 - progress)} ${534 * progress}" opacity="0.6"/>`;
        }

        // 路线标签
        const labelPos = { top: [20, 150], mid: [145, 155], bot: [195, 285] }[lane];
        const label = { top: '上', mid: '中', bot: '下' }[lane];
        svg += `<text x="${labelPos[0]}" y="${labelPos[1]}" fill="#ffffff40" font-size="10" font-weight="700">${label}</text>`;
    }

    // 防御塔
    for (const [lane, positions] of Object.entries(TOWER_POS)) {
        const laneData = lanes[lane];
        if (!laneData) continue;
        positions.my.forEach((pos, i) => {
            const alive = i < laneData.myTowers;
            svg += _towerSVG(pos[0], pos[1], alive, 'my');
        });
        positions.enemy.forEach((pos, i) => {
            const alive = i < laneData.enemyTowers;
            svg += _towerSVG(pos[0], pos[1], alive, 'enemy');
        });
    }

    // 野区目标
    if (baronAlive) {
        svg += `<g class="moba-obj moba-obj--baron">
            <circle cx="${OBJ_POS.baron[0]}" cy="${OBJ_POS.baron[1]}" r="10" fill="#9b59b620" stroke="#9b59b6" stroke-width="1.5">
                <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite"/>
            </circle>
            <text x="${OBJ_POS.baron[0]}" y="${OBJ_POS.baron[1] + 3}" text-anchor="middle" fill="#9b59b6" font-size="9" font-weight="700">暴</text>
        </g>`;
    } else {
        svg += `<circle cx="${OBJ_POS.baron[0]}" cy="${OBJ_POS.baron[1]}" r="8" fill="#1a223580" stroke="#333" stroke-width="1" stroke-dasharray="2"/>`;
    }

    if (lordAlive) {
        svg += `<g class="moba-obj moba-obj--lord">
            <circle cx="${OBJ_POS.lord[0]}" cy="${OBJ_POS.lord[1]}" r="12" fill="#f0c04020" stroke="#f0c040" stroke-width="1.5">
                <animate attributeName="r" values="12;14;12" dur="2s" repeatCount="indefinite"/>
            </circle>
            <text x="${OBJ_POS.lord[0]}" y="${OBJ_POS.lord[1] + 4}" text-anchor="middle" fill="#f0c040" font-size="10" font-weight="700">主</text>
        </g>`;
    } else if (opts.showLordPlaceholder) {
        svg += `<circle cx="${OBJ_POS.lord[0]}" cy="${OBJ_POS.lord[1]}" r="10" fill="#1a223580" stroke="#333" stroke-width="1" stroke-dasharray="2"/>`;
    }

    // 推进度数字标签
    for (const [lane, laneData] of Object.entries(lanes)) {
        const numPos = { top: [125, 35], mid: [170, 145], bot: [275, 195] }[lane];
        if (!numPos) continue;
        const p = laneData.progress;
        const color = p < 40 ? '#2ecc71' : p > 60 ? '#e74c3c' : '#f0c040';
        svg += `<text x="${numPos[0]}" y="${numPos[1]}" text-anchor="middle" fill="${color}" font-size="11" font-weight="800" class="moba-lane-num">${Math.round(100 - p)}%</text>`;
    }

    svg += '</svg>';
    return svg;
}

function _towerSVG(x, y, alive, side) {
    const color = side === 'my' ? '#2a9d8f' : '#e74c3c';
    if (alive) {
        return `<g>
            <circle cx="${x}" cy="${y}" r="${TOWER_R}" fill="${color}30" stroke="${color}" stroke-width="1.5"/>
            <rect x="${x - 2}" y="${y - 3}" width="4" height="6" fill="${color}" rx="1"/>
        </g>`;
    }
    return `<g opacity="0.3">
        <circle cx="${x}" cy="${y}" r="${TOWER_R}" fill="none" stroke="#666" stroke-width="1" stroke-dasharray="2"/>
        <line x1="${x - 3}" y1="${y - 3}" x2="${x + 3}" y2="${y + 3}" stroke="#666" stroke-width="1"/>
    </g>`;
}
