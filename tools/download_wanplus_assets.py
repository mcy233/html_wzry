"""
Download team logos and player avatars from wanplus.cn for KPL teams.
Outputs:
  - resources/teams/{teamId}.png   (team logos)
  - resources/players/{playerId}.png (player avatars)
  - tools/wanplus_mapping.json     (full mapping data)
"""
import urllib.request, ssl, re, http.cookiejar, json, os, time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEAM_DIR = os.path.join(BASE_DIR, 'resources', 'teams')
PLAYER_DIR = os.path.join(BASE_DIR, 'resources', 'players')
os.makedirs(TEAM_DIR, exist_ok=True)
os.makedirs(PLAYER_DIR, exist_ok=True)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(cj),
    urllib.request.HTTPSHandler(context=ctx)
)

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

def time33(s):
    s = s[:7]
    d = 5381
    for ch in s:
        d = (d + ((d << 5) + ord(ch))) & 0xFFFFFFFF
    return d & 0x7FFFFFFF

def get_session():
    req = urllib.request.Request('https://www.wanplus.cn/kog/ranking', headers={
        'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml',
    })
    resp = opener.open(req, timeout=15)
    resp.read()
    wanplus_token = ''
    for c in cj:
        if c.name == 'wanplus_token':
            wanplus_token = c.value
    return time33(wanplus_token)

def ajax_get(url, gtk):
    req = urllib.request.Request(url, headers={
        'User-Agent': UA,
        'Referer': 'https://www.wanplus.cn/kog/ranking',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': str(gtk),
    })
    resp = opener.open(req, timeout=15)
    return json.loads(resp.read().decode('utf-8'))

def ajax_post(url, data_dict, gtk):
    data_dict['_gtk'] = gtk
    body = '&'.join(f'{k}={v}' for k, v in data_dict.items()).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers={
        'User-Agent': UA,
        'Referer': 'https://www.wanplus.cn/kog/ranking',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': str(gtk),
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    })
    resp = opener.open(req, timeout=15)
    return resp.read().decode('utf-8')

def download_image(url, save_path):
    if os.path.exists(save_path) and os.path.getsize(save_path) > 100:
        return True
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': UA,
            'Referer': 'https://www.wanplus.cn/',
        })
        resp = urllib.request.urlopen(req, timeout=15, context=ctx)
        data = resp.read()
        if len(data) > 100:
            with open(save_path, 'wb') as f:
                f.write(data)
            return True
    except Exception as e:
        print(f"    Download failed {url}: {e}")
    return False

# ── Main ──

print("=== Step 1: Get session ===")
gtk = get_session()
print(f"GTK: {gtk}")

print("\n=== Step 2: Fetch all KOG teams ===")
all_teams = []
for page in range(1, 5):
    try:
        url = f'https://www.wanplus.cn/ajax/detailranking?country=&type=1&teamPage={page}&game=6&_gtk={gtk}'
        result = ajax_get(url, gtk)
        teams = result.get('data', [])
        if not teams:
            break
        all_teams.extend(teams)
        print(f"  Page {page}: {len(teams)} teams")
    except Exception as e:
        print(f"  Page {page} error: {e}")
        break
print(f"Total teams found: {len(all_teams)}")

# Our target KPL teams (main roster only, no youth teams)
TARGET_KEYWORDS = [
    'eStarPro', 'WB', '狼队', 'AG超玩会', 'DRG', 'WE', 'TTG',
    'EDG.M', 'Hero久竞', 'DYG', 'MTG', 'RW侠', 'TES.A',
    'LGD.NBW', 'KSG', 'XYG', 'JDG', 'Wz', 'EMC', 'MD',
    '火豹', 'HI', 'VTG', 'TY', 'YYG', 'TLG', 'TCG',
    'CW', 'BOA', 'MGL', 'GOG', 'RNG.M', 'NBW', 'JXG',
]

EXCLUDE_KEYWORDS = ['.Y', '青训']

matched = []
for t in all_teams:
    name = t.get('teamname', '')
    alias = t.get('teamalias', '')
    combined = name + alias
    if any(ex in combined for ex in EXCLUDE_KEYWORDS):
        continue
    for kw in TARGET_KEYWORDS:
        if kw in combined:
            matched.append(t)
            break

print(f"\nMatched KPL teams: {len(matched)}")

print("\n=== Step 3: Fetch team details and player info ===")
team_mapping = {}
for i, t in enumerate(matched):
    tid = t['teamid']
    tname = t['teamname']
    print(f"\n[{i+1}/{len(matched)}] {tname} (id={tid})")

    try:
        detail_html = ajax_post(
            'https://www.wanplus.cn/ajax/teamdetail',
            {'teamId': tid, 'teamRank': str(i+1)},
            gtk
        )

        # Extract players: href="/kog/player/{id}" ... src="{avatar}" ... <span>{name}</span>
        # More robust: find all player links and nearby img/span
        player_links = re.findall(r'/kog/player/(\d+)', detail_html)
        player_ids = list(dict.fromkeys(player_links))  # deduplicate preserving order

        players = []
        for pid in player_ids:
            # Find avatar
            avatar_match = re.search(
                rf'player/{pid}_min\.png',
                detail_html
            )
            avatar_url = f'https://static.wanplus.cn/data/kog/player/{pid}_min.png'

            # Find name: look for the pattern href="/kog/player/{pid}">NAME</a>
            name_match = re.search(
                rf'href="/kog/player/{pid}">\s*([^<]+?)\s*</a>',
                detail_html
            )
            pname = name_match.group(1).strip() if name_match else f'Player_{pid}'

            # Also check for country flag near the player
            flag_match = re.search(
                rf'player/{pid}".*?country\s+(\w+)',
                detail_html, re.DOTALL
            )
            country = flag_match.group(1) if flag_match else 'CN'

            players.append({
                'id': pid,
                'name': pname,
                'avatar_url': avatar_url,
                'country': country,
            })

        team_logo_url = f'https://static.wanplus.cn/data/kog/team/{tid}_mid.png'
        team_mapping[tid] = {
            'wanplus_id': tid,
            'name': tname,
            'alias': t.get('teamalias', ''),
            'rank': t.get('rank', ''),
            'icon_qq': t.get('teamicon', ''),
            'logo_url': team_logo_url,
            'players': players,
        }

        print(f"  Logo: {team_logo_url}")
        for p in players:
            print(f"  Player: {p['name']} ({p['id']})")

        time.sleep(0.3)
    except Exception as e:
        print(f"  Error: {e}")

print(f"\n=== Step 4: Download images ===")
success_teams = 0
success_players = 0
fail_teams = 0
fail_players = 0

for tid, info in team_mapping.items():
    # Download team logo
    save_path = os.path.join(TEAM_DIR, f'{tid}.png')
    if download_image(info['logo_url'], save_path):
        success_teams += 1
        print(f"  Team logo: {info['name']} -> {save_path}")
    else:
        fail_teams += 1

    # Download player avatars
    for p in info['players']:
        save_path = os.path.join(PLAYER_DIR, f'{p["id"]}.png')
        if download_image(p['avatar_url'], save_path):
            success_players += 1
        else:
            fail_players += 1
    time.sleep(0.2)

print(f"\nDownload complete:")
print(f"  Teams:   {success_teams} success, {fail_teams} failed")
print(f"  Players: {success_players} success, {fail_players} failed")

# Save mapping
mapping_path = os.path.join(BASE_DIR, 'tools', 'wanplus_mapping.json')
with open(mapping_path, 'w', encoding='utf-8') as f:
    json.dump(team_mapping, f, ensure_ascii=False, indent=2)
print(f"\nMapping saved to {mapping_path}")
