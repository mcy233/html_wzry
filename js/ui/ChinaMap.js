/**
 * ChinaMap - 风格化中国地图 SVG
 * 用于战队选择场景的背景地图
 * 简化的省份轮廓 + 电竞风格化渲染
 */

export function createChinaMapSVG(width = 600, height = 500) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="${width}" height="${height}" class="china-map-svg">
    <defs>
        <linearGradient id="map-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0a1628"/>
            <stop offset="100%" stop-color="#0d1f3c"/>
        </linearGradient>
        <filter id="map-glow" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <filter id="city-glow">
            <feGaussianBlur stdDeviation="4"/>
        </filter>
    </defs>

    <!-- 背景 -->
    <rect width="600" height="500" fill="url(#map-bg)" rx="12"/>

    <!-- 简化的中国地图轮廓 -->
    <g opacity="0.15" stroke="none">
        <!-- 东北 -->
        <path d="M380,20 L420,15 L460,25 L480,50 L490,80 L485,110 L470,130 L440,140 L410,135 L380,120 L365,90 L360,60 L365,35 Z" fill="#4ea8de"/>
        <!-- 华北 -->
        <path d="M365,90 L380,120 L410,135 L400,160 L380,170 L355,165 L340,150 L330,125 L340,100 Z" fill="#4ea8de"/>
        <!-- 西北 -->
        <path d="M100,60 L180,50 L260,65 L310,80 L340,100 L330,125 L290,140 L240,150 L180,145 L130,130 L90,110 L80,80 Z" fill="#4ea8de"/>
        <!-- 华东 -->
        <path d="M380,170 L400,160 L420,175 L430,200 L425,230 L410,255 L390,260 L370,250 L360,230 L365,200 Z" fill="#4ea8de"/>
        <!-- 华中 -->
        <path d="M290,140 L330,125 L355,165 L380,170 L365,200 L360,230 L340,250 L310,255 L280,240 L265,210 L270,175 Z" fill="#4ea8de"/>
        <!-- 西南 -->
        <path d="M130,130 L180,145 L240,150 L270,175 L265,210 L280,240 L270,280 L250,310 L220,330 L190,325 L160,300 L140,270 L120,230 L110,190 L115,160 Z" fill="#4ea8de"/>
        <!-- 华南 -->
        <path d="M310,255 L340,250 L370,250 L390,260 L400,290 L395,320 L380,350 L360,370 L330,380 L310,385 L290,370 L280,340 L275,310 L280,280 Z" fill="#4ea8de"/>
        <!-- 海南 -->
        <ellipse cx="340" cy="420" rx="20" ry="15" fill="#4ea8de"/>
        <!-- 台湾 -->
        <ellipse cx="430" cy="310" rx="10" ry="25" fill="#4ea8de" transform="rotate(15, 430, 310)"/>
    </g>

    <!-- 省份边界线 -->
    <g fill="none" stroke="#4ea8de" stroke-width="0.5" opacity="0.25">
        <line x1="340" y1="100" x2="355" y2="165"/>
        <line x1="330" y1="125" x2="290" y2="140"/>
        <line x1="365" y1="200" x2="270" y2="175"/>
        <line x1="340" y1="250" x2="280" y2="240"/>
        <line x1="310" y1="255" x2="280" y2="280"/>
        <line x1="370" y1="250" x2="390" y2="260"/>
    </g>

    <!-- 装饰网格 -->
    <g stroke="#1a3a5c" stroke-width="0.3" opacity="0.3">
        ${Array.from({length: 12}, (_, i) => `<line x1="0" y1="${i * 42}" x2="600" y2="${i * 42}"/>`).join('')}
        ${Array.from({length: 15}, (_, i) => `<line x1="${i * 42}" y1="0" x2="${i * 42}" y2="500"/>`).join('')}
    </g>

    <!-- 经纬度标记 -->
    <g font-size="8" fill="#2a4a6a" font-family="monospace">
        <text x="580" y="30">N45°</text>
        <text x="580" y="130">N35°</text>
        <text x="580" y="250">N25°</text>
        <text x="580" y="370">N15°</text>
        <text x="50" y="490">E80°</text>
        <text x="200" y="490">E100°</text>
        <text x="350" y="490">E115°</text>
        <text x="480" y="490">E125°</text>
    </g>

    <!-- 地图标题 -->
    <text x="300" y="475" text-anchor="middle" font-size="10" fill="#3a5a7a" font-family="sans-serif" letter-spacing="6">
        KPL 2027 · 战队分布图
    </text>

    <!-- 城市连线装饰 -->
    <g stroke="#f0c040" stroke-width="0.4" opacity="0.15" stroke-dasharray="4,6">
        <line x1="365" y1="115" x2="400" y2="260"/>
        <line x1="365" y1="115" x2="250" y2="235"/>
        <line x1="400" y1="200" x2="250" y2="235"/>
        <line x1="350" y1="290" x2="400" y2="200"/>
    </g>
    </svg>`;
}

/**
 * 城市在地图上的坐标位置（百分比）
 */
export const CITY_MAP_POSITIONS = {
    '北京':   { x: 59, y: 23 },
    '上海':   { x: 72, y: 42 },
    '成都':   { x: 40, y: 46 },
    '重庆':   { x: 44, y: 50 },
    '武汉':   { x: 55, y: 45 },
    '广州':   { x: 58, y: 64 },
    '深圳':   { x: 60, y: 66 },
    '杭州':   { x: 70, y: 44 },
    '西安':   { x: 47, y: 35 },
    '南京':   { x: 66, y: 40 },
    '苏州':   { x: 69, y: 42 },
    '济南':   { x: 62, y: 32 },
    '长沙':   { x: 54, y: 53 },
    '佛山':   { x: 57, y: 65 },
    '南通':   { x: 71, y: 39 },
    '桐乡':   { x: 70, y: 43 },
    '无锡':   { x: 68, y: 41 },
    '海口':   { x: 53, y: 78 },
};
