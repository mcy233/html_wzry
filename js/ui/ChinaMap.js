/**
 * ChinaMap - 真实中国地图 + 内嵌战队标记
 *
 * 核心方案：将战队光点作为 SVG 元素直接嵌入地图 SVG 内部，
 * 共享同一个 viewBox 坐标系（0 0 700 560）。
 * 这样无论容器大小或设备分辨率如何变化，SVG 等比缩放后
 * 光点和地图的相对位置永远精确。
 */

const SVG_W = 700, SVG_H = 560;
const LON_MIN = 73, LON_MAX = 136;
const LAT_MIN = 17, LAT_MAX = 55;

function geoToSvg(lon, lat) {
    const x = (lon - LON_MIN) / (LON_MAX - LON_MIN) * SVG_W;
    const y = (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * SVG_H;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

/**
 * 城市真实经纬度
 */
const CITY_COORDS = {
    '北京': [116.4, 39.9],
    '上海': [121.5, 31.2],
    '成都': [104.1, 30.6],
    '重庆': [106.5, 29.6],
    '武汉': [114.3, 30.6],
    '广州': [113.3, 23.1],
    '深圳': [114.1, 22.5],
    '杭州': [120.2, 30.3],
    '西安': [108.9, 34.3],
    '苏州': [120.6, 31.3],
    '济南': [117.0, 36.7],
    '长沙': [113.0, 28.2],
    '佛山': [113.1, 23.0],
    '南通': [120.9, 32.1],
    '桐乡': [120.6, 30.6],
    '无锡': [120.3, 31.6],
    '海口': [110.3, 20.0],
};

/**
 * 加载地图 SVG 并注入战队标记，返回完整的 inline SVG 元素
 * @param {Array} teams - TEAMS 数组
 * @returns {Promise<HTMLElement>} SVG DOM 元素
 */
export async function loadChinaMapWithTeams(teams) {
    const resp = await fetch('resources/ui/china-map.svg');
    const svgText = await resp.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;

    svg.classList.add('china-map-svg');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const markersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    markersGroup.setAttribute('class', 'map-markers');

    const positioned = _layoutTeams(teams);

    for (const { team, x, y } of positioned) {
        const g = _createTeamMarker(team, x, y);
        markersGroup.appendChild(g);
    }

    svg.appendChild(markersGroup);
    return svg;
}

/**
 * 计算所有战队的 SVG 坐标，处理同城偏移和聚集排斥
 */
function _layoutTeams(teams) {
    const result = teams.map(team => {
        const coords = CITY_COORDS[team.city];
        if (!coords) return { team, x: 350, y: 280 };
        const { x, y } = geoToSvg(coords[0], coords[1]);
        return { team, x, y };
    });

    // 同城战队初始偏移 (SVG px)
    const cityCount = {};
    for (const item of result) {
        const c = item.team.city;
        cityCount[c] = (cityCount[c] || 0) + 1;
    }
    const cityIndex = {};
    for (const item of result) {
        const c = item.team.city;
        if (cityCount[c] > 1) {
            const idx = cityIndex[c] = (cityIndex[c] || 0) + 1;
            const angle = (idx / cityCount[c]) * Math.PI * 2;
            item.x += Math.cos(angle) * 18;
            item.y += Math.sin(angle) * 18;
        }
    }

    // 力排斥：确保所有光点之间不重叠 (最小距离 35px in SVG space)
    const MIN_DIST = 35;
    for (let iter = 0; iter < 200; iter++) {
        let moved = false;
        for (let i = 0; i < result.length; i++) {
            for (let j = i + 1; j < result.length; j++) {
                const a = result[i], b = result[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MIN_DIST && dist > 0.1) {
                    const strength = (MIN_DIST - dist) / MIN_DIST * 0.6;
                    const nx = dx / dist, ny = dy / dist;
                    a.x += nx * strength * MIN_DIST * 0.5;
                    a.y += ny * strength * MIN_DIST * 0.5;
                    b.x -= nx * strength * MIN_DIST * 0.5;
                    b.y -= ny * strength * MIN_DIST * 0.5;
                    moved = true;
                }
            }
        }
        if (!moved) break;
    }

    // Clamp to SVG bounds
    for (const item of result) {
        item.x = Math.max(20, Math.min(SVG_W - 20, item.x));
        item.y = Math.max(20, Math.min(SVG_H - 20, item.y));
    }

    return result;
}

/**
 * 创建单个战队标记的 SVG <g> 元素
 */
function _createTeamMarker(team, cx, cy) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'map-team-marker');
    g.setAttribute('data-team-id', team.id);
    g.setAttribute('transform', `translate(${cx},${cy})`);
    g.style.cursor = 'pointer';

    // Pulse animation ring
    const pulse = document.createElementNS(ns, 'circle');
    pulse.setAttribute('r', '12');
    pulse.setAttribute('fill', 'none');
    pulse.setAttribute('stroke', team.color);
    pulse.setAttribute('stroke-width', '1.5');
    pulse.setAttribute('class', 'marker-pulse');
    g.appendChild(pulse);

    // Main dot
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('r', '8');
    dot.setAttribute('fill', team.color);
    dot.setAttribute('stroke', 'rgba(255,255,255,0.6)');
    dot.setAttribute('stroke-width', '2');
    dot.setAttribute('class', 'marker-dot');
    g.appendChild(dot);

    // Team label
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('y', '20');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'marker-label');
    text.setAttribute('fill', '#fff');
    text.setAttribute('font-size', '10');
    text.setAttribute('font-weight', '700');
    text.setAttribute('font-family', 'sans-serif');
    text.textContent = team.shortName;
    g.appendChild(text);

    return g;
}

// Legacy export for compatibility
export const CITY_MAP_POSITIONS = {};
for (const [city, [lon, lat]] of Object.entries(CITY_COORDS)) {
    const { x, y } = geoToSvg(lon, lat);
    CITY_MAP_POSITIONS[city] = { x: x / SVG_W * 100, y: y / SVG_H * 100 };
}
