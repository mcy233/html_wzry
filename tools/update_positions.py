"""Update team mapPosition values in teams.js based on new China map coordinates."""
import re, sys
sys.stdout.reconfigure(encoding='utf-8')

# New positions matching ChinaMap.js CITY_MAP_POSITIONS
# For teams in the same city, slightly offset them
TEAM_POSITIONS = {
    'wb':     {'x': 67.0, 'y': 38.5},   # 北京 (left of center)
    'jdg':    {'x': 71.0, 'y': 40.5},   # 北京 (right of center)
    'ag':     {'x': 49.4, 'y': 64.2},   # 成都
    'wolves': {'x': 53.2, 'y': 66.8},   # 重庆
    'estar':  {'x': 65.6, 'y': 64.2},   # 武汉
    'ksg':    {'x': 78.0, 'y': 60.5},   # 苏州
    'rngm':   {'x': 82.5, 'y': 62.0},   # 上海 (right)
    'edgm':   {'x': 80.0, 'y': 64.0},   # 上海 (left-bottom)
    'ttg':    {'x': 61.5, 'y': 83.0},   # 广州
    'dyg':    {'x': 67.0, 'y': 86.0},   # 深圳
    'hero':   {'x': 79.5, 'y': 57.0},   # 南通
    'rw':     {'x': 69.8, 'y': 48.2},   # 济南
    'lgd':    {'x': 77.5, 'y': 66.5},   # 杭州
    'we':     {'x': 57.0, 'y': 54.5},   # 西安
    'tesa':   {'x': 63.5, 'y': 70.5},   # 长沙
    'drg':    {'x': 58.5, 'y': 86.0},   # 佛山
    'qj':     {'x': 79.0, 'y': 64.5},   # 桐乡
    'tcg':    {'x': 76.0, 'y': 58.5},   # 无锡
}

filepath = r'd:\project_data\html小游戏\王者荣耀比赛\js\data\teams.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

for team_id, pos in TEAM_POSITIONS.items():
    # Match: id: 'team_id', ... mapPosition: { x: ..., y: ... }
    # We need to find mapPosition within the team block
    pattern = rf"(id: '{team_id}'.*?mapPosition:\s*\{{\s*)x:\s*[\d.]+,\s*y:\s*[\d.]+"
    replacement = rf"\g<1>x: {pos['x']}, y: {pos['y']}"
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    if new_content != content:
        print(f"  Updated {team_id}: x={pos['x']}, y={pos['y']}")
        content = new_content
    else:
        print(f"  SKIP {team_id}: pattern not found")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("\nDone! teams.js updated.")
