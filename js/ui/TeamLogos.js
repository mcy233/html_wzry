/**
 * TeamLogos - 战队SVG Logo生成器
 * 为每支KPL战队生成独特的矢量Logo
 * 基于战队品牌色、缩写、风格元素
 */

const LOGO_DEFS = {
    wb:  { symbol: '🐺', shape: 'shield',  accent: '#ff3333', pattern: 'stripes' },
    jdg: { symbol: '⚔️', shape: 'diamond', accent: '#c8102e', pattern: 'cross' },
    ag:  { symbol: '🎮', shape: 'circle',  accent: '#00b4d8', pattern: 'wave' },
    wolf:{ symbol: '🐺', shape: 'hexagon', accent: '#1d3557', pattern: 'fangs' },
    estar:{ symbol: '⭐', shape: 'star5',  accent: '#0077b6', pattern: 'glow' },
    ttg: { symbol: '🐏', shape: 'shield',  accent: '#2196f3', pattern: 'flame' },
    hero:{ symbol: '🗡️', shape: 'hexagon', accent: '#6a0dad', pattern: 'stripes' },
    dyg: { symbol: '🐉', shape: 'circle',  accent: '#e63946', pattern: 'scales' },
    gk:  { symbol: '👑', shape: 'diamond', accent: '#003049', pattern: 'crown' },
    drg: { symbol: '🐲', shape: 'hexagon', accent: '#2a9d8f', pattern: 'scales' },
    xyx: { symbol: '🦅', shape: 'shield',  accent: '#e63946', pattern: 'wing' },
    lg:  { symbol: '🦢', shape: 'circle',  accent: '#264653', pattern: 'wave' },
    ksg: { symbol: '🛡️', shape: 'shield',  accent: '#457b9d', pattern: 'cross' },
    gz:  { symbol: '🏛️', shape: 'diamond', accent: '#f4a261', pattern: 'pillar' },
    wz:  { symbol: '⚡', shape: 'hexagon', accent: '#e76f51', pattern: 'bolt' },
    nova:{ symbol: '🌟', shape: 'star5',   accent: '#ffd700', pattern: 'glow' },
    edg: { symbol: '🗡️', shape: 'diamond', accent: '#000000', pattern: 'edge' },
    vg:  { symbol: '🌀', shape: 'circle',  accent: '#00796b', pattern: 'swirl' },
};

function shapePathD(shape, cx, cy, r) {
    switch (shape) {
        case 'shield': {
            const t = cy - r, b = cy + r * 1.15, l = cx - r * 0.85, ri = cx + r * 0.85;
            return `M${cx},${t} L${ri},${cy - r*0.3} L${ri},${cy+r*0.3} L${cx},${b} L${l},${cy+r*0.3} L${l},${cy-r*0.3} Z`;
        }
        case 'diamond': {
            return `M${cx},${cy-r} L${cx+r*0.8},${cy} L${cx},${cy+r} L${cx-r*0.8},${cy} Z`;
        }
        case 'hexagon': {
            const pts = [];
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i - Math.PI / 2;
                pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
            }
            return `M${pts.join(' L')} Z`;
        }
        case 'star5': {
            const pts = [];
            for (let i = 0; i < 10; i++) {
                const a = (Math.PI / 5) * i - Math.PI / 2;
                const rad = i % 2 === 0 ? r : r * 0.45;
                pts.push(`${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`);
            }
            return `M${pts.join(' L')} Z`;
        }
        default: return '';
    }
}

function patternMarkup(pattern, color, id) {
    const c = color + '33';
    switch (pattern) {
        case 'stripes':
            return `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="4" height="8" fill="${c}"/></pattern>`;
        case 'cross':
            return `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse">
                <line x1="0" y1="5" x2="10" y2="5" stroke="${c}" stroke-width="1"/>
                <line x1="5" y1="0" x2="5" y2="10" stroke="${c}" stroke-width="1"/></pattern>`;
        case 'wave':
            return `<pattern id="${id}" width="20" height="10" patternUnits="userSpaceOnUse">
                <path d="M0,5 Q5,0 10,5 Q15,10 20,5" stroke="${c}" fill="none" stroke-width="1.5"/></pattern>`;
        case 'scales':
            return `<pattern id="${id}" width="12" height="10" patternUnits="userSpaceOnUse">
                <path d="M0,10 Q6,2 12,10" stroke="${c}" fill="none" stroke-width="1"/></pattern>`;
        default:
            return `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="4" cy="4" r="1.5" fill="${c}"/></pattern>`;
    }
}

/**
 * 生成战队SVG logo（返回 innerHTML 字符串）
 * @param {string} teamId
 * @param {object} team - { shortName, color }
 * @param {number} size
 */
export function generateTeamLogo(teamId, team, size = 64) {
    const def = LOGO_DEFS[teamId] || { symbol: '🏅', shape: 'circle', accent: team.color || '#888', pattern: 'stripes' };
    const color = team.color || def.accent;
    const cx = size / 2, cy = size / 2, r = size * 0.42;
    const patId = `pat-${teamId}-${Math.random().toString(36).slice(2, 6)}`;
    const isCircle = def.shape === 'circle';

    let bgShape;
    if (isCircle) {
        bgShape = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="${color}" stroke-width="2" opacity="0.9"/>
                    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${patId})" opacity="0.5"/>
                    <circle cx="${cx}" cy="${cy}" r="${r*0.85}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>`;
    } else {
        const d = shapePathD(def.shape, cx, cy, r);
        bgShape = `<path d="${d}" fill="${color}" stroke="${color}" stroke-width="2" opacity="0.9"/>
                    <path d="${d}" fill="url(#${patId})" opacity="0.5"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <defs>
            ${patternMarkup(def.pattern, color, patId)}
            <filter id="glow-${teamId}" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
        </defs>
        <g filter="url(#glow-${teamId})">
            ${bgShape}
        </g>
        <text x="${cx}" y="${cy + size*0.06}" text-anchor="middle" dominant-baseline="middle"
              font-family="'PingFang SC','Microsoft YaHei',sans-serif"
              font-size="${size * 0.28}" font-weight="900" fill="#fff"
              stroke="rgba(0,0,0,0.3)" stroke-width="0.5">${team.shortName}</text>
    </svg>`;
}

/**
 * 生成选手头像 SVG
 */
export function generatePlayerAvatar(player, teamColor, size = 48) {
    const initial = player.id.charAt(0);
    const hue = hashStr(player.id) % 360;
    const bgColor = teamColor || `hsl(${hue}, 60%, 35%)`;
    const ratingColor = player.rating >= 85 ? '#f0c040' : player.rating >= 75 ? '#4ea8de' : '#8892a4';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <defs>
            <linearGradient id="ag-${player.id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="${bgColor}"/>
                <stop offset="100%" stop-color="${darken(bgColor, 30)}"/>
            </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" rx="${size*0.18}" fill="url(#ag-${player.id})"/>
        <text x="${size/2}" y="${size*0.52}" text-anchor="middle" dominant-baseline="middle"
              font-size="${size*0.42}" font-weight="800" fill="rgba(255,255,255,0.9)"
              font-family="'PingFang SC','Microsoft YaHei',sans-serif">${initial}</text>
        <rect x="0" y="${size*0.78}" width="${size}" height="${size*0.22}" rx="${size*0.05}" fill="rgba(0,0,0,0.4)"/>
        <text x="${size/2}" y="${size*0.91}" text-anchor="middle" dominant-baseline="middle"
              font-size="${size*0.14}" font-weight="700" fill="${ratingColor}"
              font-family="sans-serif">${player.rating}</text>
    </svg>`;
}

function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
}

function darken(hex, pct) {
    if (hex.startsWith('hsl')) return hex;
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - pct);
    const g = Math.max(0, ((num >> 8) & 0xff) - pct);
    const b = Math.max(0, (num & 0xff) - pct);
    return `rgb(${r},${g},${b})`;
}
