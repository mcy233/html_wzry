"""Fetch all KOG team and player data from wanplus"""
import urllib.request, ssl, re, http.cookiejar, json, os, time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(cj),
    urllib.request.HTTPSHandler(context=ctx)
)

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

def time33(s):
    s = s[:7]
    d = 5381
    for ch in s:
        d = (d + ((d << 5) + ord(ch))) & 0xFFFFFFFF
    return d & 0x7FFFFFFF

# Step 1: Get session
req = urllib.request.Request('https://www.wanplus.cn/kog/ranking', headers={
    'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml',
})
resp = opener.open(req, timeout=15)
html = resp.read().decode('utf-8')

wanplus_token = ''
for c in cj:
    if c.name == 'wanplus_token':
        wanplus_token = c.value
gtk = time33(wanplus_token)

headers2 = {
    'User-Agent': UA,
    'Referer': 'https://www.wanplus.cn/kog/ranking',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-Token': str(gtk),
    'Accept': '*/*',
}

# Step 2: Fetch all team pages
all_teams = []
for page in range(1, 5):
    url = f'https://www.wanplus.cn/ajax/detailranking?country=&type=1&teamPage={page}&game=6&_gtk={gtk}'
    req = urllib.request.Request(url, headers=headers2)
    try:
        resp = opener.open(req, timeout=15)
        result = json.loads(resp.read().decode('utf-8'))
        teams = result.get('data', [])
        if not teams:
            break
        all_teams.extend(teams)
        print(f"Page {page}: {len(teams)} teams")
    except Exception as e:
        print(f"Page {page} error: {e}")
        break

print(f"\nTotal teams: {len(all_teams)}")

# Filter to our target teams (top KPL teams)
target_teams = [
    'eStarPro', 'WB', '狼队', 'AG超玩会', 'DRG', 'WE', 'TTG',
    'EDG.M', 'Hero久竞', 'DYG', 'MTG', 'RW侠', 'TES',
    'LGD', 'KSG', 'XYG', 'JDG'
]

matched = []
for t in all_teams:
    name = t.get('teamname', '')
    alias = t.get('teamalias', '')
    for target in target_teams:
        if target in name or target in alias:
            matched.append(t)
            break

print(f"\nMatched target teams: {len(matched)}")
for t in matched:
    print(f"  {t['teamid']}: {t['teamname']} (icon: {t.get('teamicon', 'N/A')})")

# Step 3: Fetch team detail with player info for each matched team
team_data = {}
for i, t in enumerate(matched[:20]):
    tid = t['teamid']
    rank = i + 1
    try:
        data = f'_gtk={gtk}&teamId={tid}&teamRank={rank}'.encode('utf-8')
        req = urllib.request.Request(
            'https://www.wanplus.cn/ajax/teamdetail',
            data=data,
            headers={**headers2, 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
        )
        resp = opener.open(req, timeout=15)
        detail_html = resp.read().decode('utf-8')
        
        # Extract player info
        players = []
        player_blocks = re.findall(
            r'<a[^>]*href="/kog/player/(\d+)"[^>]*>.*?src="([^"]*)".*?<span>([^<]+)</span>',
            detail_html, re.DOTALL
        )
        for pid, img, pname in player_blocks:
            players.append({'id': pid, 'name': pname.strip(), 'avatar': img})
        
        # Also try extracting team logo from detail
        team_logo = re.findall(r'<img[^>]*src="([^"]*)"[^>]*alt="[^"]*"[^>]*class="ranking_default_img"', detail_html)
        
        team_data[tid] = {
            'id': tid,
            'name': t['teamname'],
            'icon': t.get('teamicon', ''),
            'logo_from_detail': team_logo[0] if team_logo else '',
            'players': players,
        }
        print(f"\n{t['teamname']} ({tid}): logo={team_logo[0] if team_logo else 'N/A'}, {len(players)} players")
        for p in players:
            print(f"    {p['name']}: {p['avatar']}")
        
        time.sleep(0.3)
    except Exception as e:
        print(f"Error fetching {t['teamname']}: {e}")

# Save results
with open(r'd:\project_data\html小游戏\王者荣耀比赛\tools\wanplus_teams.json', 'w', encoding='utf-8') as f:
    json.dump(team_data, f, ensure_ascii=False, indent=2)

print(f"\nSaved {len(team_data)} teams to wanplus_teams.json")
