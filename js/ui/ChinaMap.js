/**
 * ChinaMap - 真实中国地图 + 内嵌战队标记
 *
 * 战队光点作为 SVG 元素嵌入地图 SVG 内部，共享 viewBox 坐标系。
 * 位置基于真实经纬度投影，仅对重叠做微量偏移（弹簧回拉保持接近真实位置）。
 */

const SVG_W = 700, SVG_H = 560;
const LON_MIN = 73, LON_MAX = 136;
const LAT_MIN = 17, LAT_MAX = 55;

function geoToSvg(lon, lat) {
    const x = (lon - LON_MIN) / (LON_MAX - LON_MIN) * SVG_W;
    const y = (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * SVG_H;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

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
 * 加载地图 SVG 并注入战队标记
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
 * 计算战队 SVG 坐标：真实投影 + 轻量排斥 + 弹簧回拉
 */
function _layoutTeams(teams) {
    const result = teams.map(team => {
        const coords = CITY_COORDS[team.city];
        if (!coords) return { team, ox: 350, oy: 280, x: 350, y: 280 };
        const { x, y } = geoToSvg(coords[0], coords[1]);
        return { team, ox: x, oy: y, x, y };
    });

    // 同城战队初始微偏移
    const cityTeams = {};
    for (const item of result) {
        const c = item.team.city;
        (cityTeams[c] = cityTeams[c] || []).push(item);
    }
    for (const [, items] of Object.entries(cityTeams)) {
        if (items.length <= 1) continue;
        const n = items.length;
        items.forEach((item, i) => {
            const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
            item.x += Math.cos(angle) * 14;
            item.y += Math.sin(angle) * 14;
        });
    }

    // 轻量排斥 + 弹簧回拉（保持接近真实地理位置）
    const MIN_DIST = 24;
    const SPRING = 0.15;
    for (let iter = 0; iter < 80; iter++) {
        for (let i = 0; i < result.length; i++) {
            for (let j = i + 1; j < result.length; j++) {
                const a = result[i], b = result[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MIN_DIST && dist > 0.1) {
                    const push = (MIN_DIST - dist) * 0.25;
                    const nx = dx / dist, ny = dy / dist;
                    a.x += nx * push;
                    a.y += ny * push;
                    b.x -= nx * push;
                    b.y -= ny * push;
                }
            }
        }
        // 弹簧：拉回原始位置
        for (const item of result) {
            item.x += (item.ox - item.x) * SPRING;
            item.y += (item.oy - item.y) * SPRING;
        }
    }

    for (const item of result) {
        item.x = Math.max(15, Math.min(SVG_W - 15, item.x));
        item.y = Math.max(15, Math.min(SVG_H - 15, item.y));
    }

    return result;
}

/**
 * 创建战队标记 SVG <g>，包含原生 <animate> 动画
 */
function _createTeamMarker(team, cx, cy) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'map-team-marker');
    g.setAttribute('data-team-id', team.id);
    g.setAttribute('transform', `translate(${cx.toFixed(1)},${cy.toFixed(1)})`);
    g.style.cursor = 'pointer';

    // 呼吸脉冲环 — 使用 SVG <animate> 保证兼容性
    const pulse = document.createElementNS(ns, 'circle');
    pulse.setAttribute('cx', '0');
    pulse.setAttribute('cy', '0');
    pulse.setAttribute('r', '8');
    pulse.setAttribute('fill', 'none');
    pulse.setAttribute('stroke', team.color);
    pulse.setAttribute('stroke-width', '1.5');
    pulse.setAttribute('opacity', '0');

    const animR = document.createElementNS(ns, 'animate');
    animR.setAttribute('attributeName', 'r');
    animR.setAttribute('values', '8;20');
    animR.setAttribute('dur', '2.5s');
    animR.setAttribute('repeatCount', 'indefinite');
    pulse.appendChild(animR);

    const animOp = document.createElementNS(ns, 'animate');
    animOp.setAttribute('attributeName', 'opacity');
    animOp.setAttribute('values', '0.6;0');
    animOp.setAttribute('dur', '2.5s');
    animOp.setAttribute('repeatCount', 'indefinite');
    pulse.appendChild(animOp);

    const animSW = document.createElementNS(ns, 'animate');
    animSW.setAttribute('attributeName', 'stroke-width');
    animSW.setAttribute('values', '2;0.5');
    animSW.setAttribute('dur', '2.5s');
    animSW.setAttribute('repeatCount', 'indefinite');
    pulse.appendChild(animSW);

    g.appendChild(pulse);

    // 外发光 (静态)
    const glow = document.createElementNS(ns, 'circle');
    glow.setAttribute('cx', '0');
    glow.setAttribute('cy', '0');
    glow.setAttribute('r', '11');
    glow.setAttribute('fill', team.color);
    glow.setAttribute('opacity', '0.15');
    g.appendChild(glow);

    // 主圆点
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', '0');
    dot.setAttribute('cy', '0');
    dot.setAttribute('r', '7');
    dot.setAttribute('fill', team.color);
    dot.setAttribute('stroke', 'rgba(255,255,255,0.7)');
    dot.setAttribute('stroke-width', '1.5');
    dot.setAttribute('class', 'marker-dot');
    g.appendChild(dot);

    // 标签
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '18');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'marker-label');
    text.setAttribute('fill', '#ddd');
    text.setAttribute('font-size', '9');
    text.setAttribute('font-weight', '700');
    text.setAttribute('font-family', 'system-ui, sans-serif');
    text.textContent = team.shortName;
    g.appendChild(text);

    return g;
}

// Legacy export
export const CITY_MAP_POSITIONS = {};
for (const [city, [lon, lat]] of Object.entries(CITY_COORDS)) {
    const { x, y } = geoToSvg(lon, lat);
    CITY_MAP_POSITIONS[city] = { x: x / SVG_W * 100, y: y / SVG_H * 100 };
}
