"""Apply the final calculated positions to teams.js"""
import re, sys
sys.stdout.reconfigure(encoding='utf-8')

TEAM_POSITIONS = {
    'wb':     {'x': 66.4, 'y': 38.2},
    'jdg':    {'x': 71.4, 'y': 41.2},
    'ag':     {'x': 49.0, 'y': 64.0},
    'wolves': {'x': 53.5, 'y': 67.1},
    'estar':  {'x': 65.6, 'y': 64.2},
    'ksg':    {'x': 76.2, 'y': 61.5},
    'rngm':   {'x': 81.6, 'y': 60.2},
    'edgm':   {'x': 72.2, 'y': 65.3},
    'ttg':    {'x': 65.2, 'y': 81.5},
    'dyg':    {'x': 66.7, 'y': 87.0},
    'hero':   {'x': 76.9, 'y': 56.0},
    'rw':     {'x': 69.8, 'y': 48.2},
    'lgd':    {'x': 73.8, 'y': 70.5},
    'we':     {'x': 57.0, 'y': 54.5},
    'tesa':   {'x': 63.5, 'y': 70.5},
    'drg':    {'x': 61.0, 'y': 85.1},
    'qj':     {'x': 79.0, 'y': 66.3},
    'tcg':    {'x': 71.4, 'y': 58.9},
}

filepath = r'd:\project_data\html小游戏\王者荣耀比赛\js\data\teams.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

for team_id, pos in TEAM_POSITIONS.items():
    pattern = rf"(id: '{team_id}'.*?mapPosition:\s*\{{\s*)x:\s*[\d.]+,\s*y:\s*[\d.]+"
    replacement = rf"\g<1>x: {pos['x']}, y: {pos['y']}"
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    if new_content != content:
        print(f"  Updated {team_id}: x={pos['x']}, y={pos['y']}")
        content = new_content
    else:
        print(f"  SKIP {team_id}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done!")
