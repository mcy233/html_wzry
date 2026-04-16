"""
Recalculate team positions to match the SVG viewBox coordinate system exactly.
Then detect clusters and apply force-based repulsion to avoid overlap.
"""
import math, sys
sys.stdout.reconfigure(encoding='utf-8')

LON_MIN, LON_MAX = 73, 136
LAT_MIN, LAT_MAX = 17, 55
SVG_W, SVG_H = 700, 560

def project(lon, lat):
    x = (lon - LON_MIN) / (LON_MAX - LON_MIN) * SVG_W
    y = (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * SVG_H
    px = x / SVG_W * 100
    py = y / SVG_H * 100
    return px, py

TEAMS = {
    'wb':     ('北京',   116.4, 39.9),
    'jdg':    ('北京',   116.4, 39.9),
    'ag':     ('成都',   104.1, 30.6),
    'wolves': ('重庆',   106.5, 29.6),
    'estar':  ('武汉',   114.3, 30.6),
    'ksg':    ('苏州',   120.6, 31.3),
    'rngm':   ('上海',   121.5, 31.2),
    'edgm':   ('上海',   121.5, 31.2),
    'ttg':    ('广州',   113.3, 23.1),
    'dyg':    ('深圳',   114.1, 22.5),
    'hero':   ('南通',   120.9, 32.1),
    'rw':     ('济南',   117.0, 36.7),
    'lgd':    ('杭州',   120.2, 30.3),
    'we':     ('西安',   108.9, 34.3),
    'tesa':   ('长沙',   113.0, 28.2),
    'drg':    ('佛山',   113.1, 23.0),
    'qj':     ('桐乡',   120.6, 30.6),
    'tcg':    ('无锡',   120.3, 31.6),
}

positions = {}
for tid, (city, lon, lat) in TEAMS.items():
    px, py = project(lon, lat)
    positions[tid] = [px, py]

# Pre-offset same-city teams
SAME_CITY_OFFSETS = {
    'wb':   (-2.5, -1.5),
    'jdg':  ( 2.5,  1.5),
    'rngm': ( 2.0, -2.0),
    'edgm': (-2.0,  2.0),
}
for tid, (dx, dy) in SAME_CITY_OFFSETS.items():
    positions[tid][0] += dx
    positions[tid][1] += dy

MIN_DIST = 5.5
ITERATIONS = 300

for _ in range(ITERATIONS):
    items = list(positions.items())
    forces = {tid: [0.0, 0.0] for tid in positions}
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            t1, p1 = items[i]
            t2, p2 = items[j]
            dx = p1[0] - p2[0]
            dy = p1[1] - p2[1]
            dist = math.sqrt(dx*dx + dy*dy)
            if dist < MIN_DIST and dist > 0.01:
                strength = (MIN_DIST - dist) / MIN_DIST * 1.5
                nx, ny = dx / dist, dy / dist
                forces[t1][0] += nx * strength
                forces[t1][1] += ny * strength
                forces[t2][0] -= nx * strength
                forces[t2][1] -= ny * strength
    for tid in positions:
        positions[tid][0] += forces[tid][0]
        positions[tid][1] += forces[tid][1]
        positions[tid][0] = max(2, min(98, positions[tid][0]))
        positions[tid][1] = max(2, min(98, positions[tid][1]))

print("=== Final team positions ===")
for tid, (px, py) in sorted(positions.items()):
    city = TEAMS[tid][0]
    print(f"  '{tid}': {{ x: {round(px, 1)}, y: {round(py, 1)} }},  // {city}")

# Generate the JS for ChinaMap.js CITY_MAP_POSITIONS
cities_done = set()
print("\n=== CITY_MAP_POSITIONS ===")
for tid, (city, lon, lat) in TEAMS.items():
    if city not in cities_done:
        px, py = positions[tid]
        cities_done.add(city)
        print(f"    '{city}': {{ x: {round(px, 1)}, y: {round(py, 1)} }},")

# Verify no clusters remain
print("\n=== Remaining clusters (< 5%) ===")
items = list(positions.items())
for i in range(len(items)):
    for j in range(i + 1, len(items)):
        t1, p1 = items[i]
        t2, p2 = items[j]
        dist = math.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)
        if dist < 5:
            print(f"  {t1}({TEAMS[t1][0]}) <-> {t2}({TEAMS[t2][0]}): dist={dist:.1f}")
