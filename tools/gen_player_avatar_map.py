"""
Read players_mapping.json and generate a JS mapping for player avatars
from the players_by_team folder.
"""
import json, os, sys
sys.stdout.reconfigure(encoding='utf-8')

BASE = r'd:\project_data\html小游戏\王者荣耀比赛'
mapping_path = os.path.join(BASE, 'resources', 'players_by_team', 'players_mapping.json')

with open(mapping_path, 'r', encoding='utf-8') as f:
    players = json.load(f)

# Verify files exist
avatar_dir = os.path.join(BASE, 'resources', 'players_by_team')
found = 0
missing = 0
entries = {}

for p in players:
    pid = p['player_id']
    fname = p['file']
    fpath = os.path.join(avatar_dir, fname)
    if os.path.exists(fpath):
        entries[pid] = f'resources/players_by_team/{fname}'
        found += 1
    else:
        missing += 1
        print(f"  MISSING: {fname}")

print(f"\nFound: {found}, Missing: {missing}")
print(f"Unique players: {len(entries)}")

# Generate JS
js_lines = []
js_lines.append("/**")
js_lines.append(" * playerAvatarsByTeam.js - 选手高清头像映射")
js_lines.append(" * 从 players_by_team 文件夹生成，选手ID -> 头像路径")
js_lines.append(" * 自动生成，勿手动编辑")
js_lines.append(" */")
js_lines.append("")
js_lines.append("export const PLAYER_HD_AVATARS = {")
for pid, path in sorted(entries.items()):
    js_lines.append(f"    '{pid}': '{path}',")
js_lines.append("};")
js_lines.append("")
js_lines.append("export function getPlayerHDAvatarPath(playerName) {")
js_lines.append("    return PLAYER_HD_AVATARS[playerName] || null;")
js_lines.append("}")

output_path = os.path.join(BASE, 'js', 'data', 'playerAvatarsByTeam.js')
with open(output_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(js_lines))

print(f"\nGenerated: {output_path}")
