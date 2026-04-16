"""
Fetch China map GeoJSON from DataV and convert to SVG paths for the game.
Uses simplified China boundary (no provinces, just outline + provinces).
"""
import urllib.request, ssl, json, sys

sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    resp = urllib.request.urlopen(req, timeout=30, context=ctx)
    return json.loads(resp.read().decode('utf-8'))

# Fetch China provinces GeoJSON (simplified)
print("Fetching China map data...")
data = fetch_json('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')

# SVG viewport: we'll project longitude/latitude to SVG coordinates
# China roughly spans: lon 73-135, lat 18-54
LON_MIN, LON_MAX = 73, 136
LAT_MIN, LAT_MAX = 17, 55
SVG_W, SVG_H = 700, 560

def project(lon, lat):
    x = (lon - LON_MIN) / (LON_MAX - LON_MIN) * SVG_W
    y = (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * SVG_H
    return round(x, 1), round(y, 1)

def coords_to_path(coords):
    """Convert a list of [lon, lat] pairs to SVG path d string."""
    parts = []
    for i, (lon, lat) in enumerate(coords):
        x, y = project(lon, lat)
        cmd = 'M' if i == 0 else 'L'
        parts.append(f'{cmd}{x},{y}')
    parts.append('Z')
    return ''.join(parts)

def geometry_to_paths(geometry):
    """Convert GeoJSON geometry to list of SVG path d strings."""
    paths = []
    gtype = geometry['type']
    coords = geometry['coordinates']
    
    if gtype == 'Polygon':
        for ring in coords:
            # Simplify: take every Nth point to reduce path size
            simplified = ring[::3] if len(ring) > 50 else ring
            if len(simplified) > 2:
                paths.append(coords_to_path(simplified))
    elif gtype == 'MultiPolygon':
        for polygon in coords:
            for ring in polygon:
                simplified = ring[::3] if len(ring) > 50 else ring
                if len(simplified) > 2:
                    paths.append(coords_to_path(simplified))
    return paths

# Province name -> color mapping for visual variety
PROVINCE_COLORS = {
    '北京市': '#2a5a8a', '天津市': '#2a5a8a', '河北省': '#1e4d7a',
    '山西省': '#1e4d7a', '内蒙古自治区': '#1a3d6a',
    '辽宁省': '#1a4570', '吉林省': '#1a4570', '黑龙江省': '#1a4570',
    '上海市': '#2a5a8a', '江苏省': '#1e5580', '浙江省': '#1e5580',
    '安徽省': '#1e4d7a', '福建省': '#1e5580', '江西省': '#1e4d7a',
    '山东省': '#1e5580', '河南省': '#1e4d7a', '湖北省': '#1e5580',
    '湖南省': '#1e4d7a', '广东省': '#2a5a8a', '广西壮族自治区': '#1e4d7a',
    '海南省': '#2a5a8a', '重庆市': '#2a5a8a', '四川省': '#1a4570',
    '贵州省': '#1a3d6a', '云南省': '#1a3d6a', '西藏自治区': '#152d55',
    '陕西省': '#1e4d7a', '甘肃省': '#1a3d6a', '青海省': '#152d55',
    '宁夏回族自治区': '#1a3d6a', '新疆维吾尔自治区': '#152d55',
    '台湾省': '#1e5580', '香港特别行政区': '#2a5a8a', '澳门特别行政区': '#2a5a8a',
}

# Generate SVG paths for each province
svg_paths = []
for feature in data['features']:
    name = feature['properties'].get('name', '')
    color = PROVINCE_COLORS.get(name, '#1a4570')
    paths = geometry_to_paths(feature['geometry'])
    for d in paths:
        svg_paths.append(f'        <path d="{d}" fill="{color}" stroke="#3a7ab5" stroke-width="0.6" opacity="0.7"/>')

print(f"Generated {len(svg_paths)} path elements")

# Build the complete SVG
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SVG_W} {SVG_H}" class="china-map-svg">
    <defs>
        <linearGradient id="map-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#060e1a"/>
            <stop offset="100%" stop-color="#0a1628"/>
        </linearGradient>
        <filter id="province-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <radialGradient id="sea-gradient" cx="0.7" cy="0.5">
            <stop offset="0%" stop-color="#0d1f3c"/>
            <stop offset="100%" stop-color="#060e1a"/>
        </radialGradient>
    </defs>
    <rect width="{SVG_W}" height="{SVG_H}" fill="url(#sea-gradient)" rx="8"/>
    <g filter="url(#province-glow)">
{chr(10).join(svg_paths)}
    </g>
    <text x="{SVG_W//2}" y="{SVG_H - 12}" text-anchor="middle" font-size="11" fill="#3a6a9a" font-family="sans-serif" letter-spacing="4">
        KPL 2027 · 战队分布图
    </text>
</svg>'''

# Save SVG file
svg_path = r'd:\project_data\html小游戏\王者荣耀比赛\resources\ui\china-map.svg'
with open(svg_path, 'w', encoding='utf-8') as f:
    f.write(svg)
print(f"Saved SVG to {svg_path} ({len(svg)} chars)")

# Also calculate proper team positions on this projection
TEAM_CITIES = {
    '北京': (116.4, 39.9),
    '上海': (121.5, 31.2),
    '成都': (104.1, 30.6),
    '重庆': (106.5, 29.6),
    '武汉': (114.3, 30.6),
    '广州': (113.3, 23.1),
    '深圳': (114.1, 22.5),
    '杭州': (120.2, 30.3),
    '西安': (108.9, 34.3),
    '苏州': (120.6, 31.3),
    '济南': (117.0, 36.7),
    '长沙': (113.0, 28.2),
    '佛山': (113.1, 23.0),
    '南通': (120.9, 32.1),
    '桐乡': (120.6, 30.6),
    '无锡': (120.3, 31.6),
}

print("\n=== City positions (percentage) ===")
positions = {}
for city, (lon, lat) in TEAM_CITIES.items():
    x, y = project(lon, lat)
    px = round(x / SVG_W * 100, 1)
    py = round(y / SVG_H * 100, 1)
    positions[city] = {'x': px, 'y': py}
    print(f"  '{city}': {{ x: {px}, y: {py} }},")

# Detect clustering and suggest adjustments
print("\n=== Cluster detection ===")
items = list(positions.items())
for i in range(len(items)):
    for j in range(i+1, len(items)):
        c1, p1 = items[i]
        c2, p2 = items[j]
        dist = ((p1['x'] - p2['x'])**2 + (p1['y'] - p2['y'])**2)**0.5
        if dist < 4:
            print(f"  CLUSTER: {c1} <-> {c2} (dist={dist:.1f}%)")
