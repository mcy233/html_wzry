#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
抓取南京Hero久竞和苏州KSG的选手头像
"""

import asyncio
import json
import os
from playwright.async_api import async_playwright

# 输出目录
OUTPUT_DIR = r"D:\project_data\html小游戏\王者荣耀比赛\resources\players_by_team"

# 目标战队
TARGET_TEAMS = ["南京Hero久竞", "苏州KSG"]

# 战队简称映射
TEAM_SHORT_NAMES = {
    "南京Hero久竞": "Hero",
    "苏州KSG": "KSG"
}

async def fetch_team_players():
    """从KPL官网抓取选手信息"""
    
    players_data = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = await context.new_page()
        
        try:
            print("正在访问KPL官网...")
            await page.goto('https://kpl.qq.com/#/Teams', wait_until='networkidle', timeout=60000)
            await asyncio.sleep(3)
            
            # 等待页面加载
            await page.wait_for_selector('.team-list, .team-item, [class*="team"]', timeout=30000)
            
            # 获取所有战队按钮/链接
            team_buttons = await page.query_selector_all('a, button, div[class*="team"], li[class*="team"]')
            print(f"找到 {len(team_buttons)} 个可能的战队元素")
            
            # 收集所有战队名称和元素
            team_elements = []
            for btn in team_buttons:
                try:
                    text = await btn.text_content()
                    if text:
                        text = text.strip()
                        # 检查是否包含目标战队名称
                        for team_name in TARGET_TEAMS:
                            if team_name in text or (team_name.replace("南京", "").replace("苏州", "")) in text:
                                team_elements.append((team_name, btn))
                                print(f"找到战队按钮: {text}")
                                break
                except:
                    pass
            
            # 如果没有找到，尝试通过页面文本搜索
            if not team_elements:
                print("尝试通过页面内容搜索战队...")
                page_content = await page.content()
                
                for team_name in TARGET_TEAMS:
                    if team_name in page_content:
                        print(f"页面中包含 {team_name}")
                        # 尝试点击包含该战队名称的元素
                        try:
                            # 使用XPath查找包含战队名称的元素
                            elements = await page.query_selector_all(f'//*[contains(text(), "{team_name}")]')
                            for elem in elements:
                                team_elements.append((team_name, elem))
                                print(f"通过XPath找到 {team_name}")
                                break
                        except Exception as e:
                            print(f"XPath搜索失败: {e}")
            
            # 处理每个目标战队
            processed_teams = set()
            for team_name, team_btn in team_elements:
                if team_name in processed_teams:
                    continue
                processed_teams.add(team_name)
                
                team_short = TEAM_SHORT_NAMES.get(team_name, team_name[:3])
                print(f"\n正在处理战队: {team_name} ({team_short})")
                
                try:
                    # 点击战队按钮
                    await team_btn.click()
                    await asyncio.sleep(2)
                    
                    # 等待选手列表加载
                    await page.wait_for_selector('.player-list, .player-item, [class*="player"], .member-list', timeout=10000)
                    
                    # 获取所有选手元素
                    player_selectors = [
                        '.player-item',
                        '.player-list .item',
                        '[class*="player-item"]',
                        '.member-item',
                        '.team-player-item',
                        'a[href*="player"]',
                        '.player-card'
                    ]
                    
                    player_elements = []
                    for selector in player_selectors:
                        player_elements = await page.query_selector_all(selector)
                        if player_elements:
                            print(f"使用选择器 '{selector}' 找到 {len(player_elements)} 个选手")
                            break
                    
                    if not player_elements:
                        # 尝试更通用的方法
                        player_elements = await page.query_selector_all('img[alt*="选手"], img[title], .avatar, .player-avatar')
                        print(f"通过通用选择器找到 {len(player_elements)} 个选手")
                    
                    # 处理每个选手
                    for idx, player_elem in enumerate(player_elements):
                        try:
                            # 获取选手名称
                            player_name = None
                            
                            # 尝试多种方式获取选手名
                            name_selectors = ['.name', '.player-name', '[class*="name"]', '.nickname', 'h3', 'h4', '.title']
                            for selector in name_selectors:
                                name_elem = await player_elem.query_selector(selector)
                                if name_elem:
                                    player_name = await name_elem.text_content()
                                    if player_name:
                                        player_name = player_name.strip()
                                        break
                            
                            # 如果没找到，尝试从父元素找
                            if not player_name:
                                parent = await player_elem.evaluate('el => el.parentElement?.textContent')
                                if parent:
                                    # 提取可能的选手名（通常是2-3个汉字）
                                    import re
                                    matches = re.findall(r'[\u4e00-\u9fa5]{2,4}', parent)
                                    if matches:
                                        player_name = matches[0]
                            
                            # 从alt或title属性获取
                            if not player_name:
                                alt = await player_elem.get_attribute('alt')
                                if alt:
                                    player_name = alt.strip()
                            
                            if not player_name:
                                title = await player_elem.get_attribute('title')
                                if title:
                                    player_name = title.strip()
                            
                            if not player_name:
                                player_name = f"选手{idx+1}"
                            
                            # 清理选手名
                            player_name = player_name.replace('（', '(').replace('）', ')')
                            if '(' in player_name:
                                player_name = player_name.split('(')[0].strip()
                            
                            print(f"  找到选手: {player_name}")
                            
                            # 获取选手头像
                            img_url = None
                            
                            # 直接是img元素
                            tag_name = await player_elem.evaluate('el => el.tagName.toLowerCase()')
                            if tag_name == 'img':
                                img_url = await player_elem.get_attribute('src')
                            else:
                                # 查找子img元素
                                img_elem = await player_elem.query_selector('img')
                                if img_elem:
                                    img_url = await img_elem.get_attribute('src')
                                else:
                                    # 尝试从背景图获取
                                    style = await player_elem.evaluate('el => getComputedStyle(el).backgroundImage')
                                    if style and style != 'none':
                                        img_url = style.replace('url("', '').replace('url(', '').replace('")', '').replace(')', '')
                            
                            if img_url:
                                # 处理相对URL
                                if img_url.startswith('//'):
                                    img_url = 'https:' + img_url
                                elif img_url.startswith('/'):
                                    img_url = 'https://kpl.qq.com' + img_url
                                
                                print(f"    头像URL: {img_url}")
                                
                                # 下载图片
                                filename = f"{team_short}-{player_name}.png"
                                filepath = os.path.join(OUTPUT_DIR, filename)
                                
                                try:
                                    response = await page.evaluate(f'''
                                        async () => {{
                                            const response = await fetch("{img_url}");
                                            const blob = await response.blob();
                                            return new Promise((resolve) => {{
                                                const reader = new FileReader();
                                                reader.onloadend = () => resolve(reader.result);
                                                reader.readAsDataURL(blob);
                                            }});
                                        }}
                                    ''')
                                    
                                    if response and ',' in response:
                                        import base64
                                        img_data = base64.b64decode(response.split(',')[1])
                                        with open(filepath, 'wb') as f:
                                            f.write(img_data)
                                        print(f"    ✓ 已保存: {filename}")
                                        
                                        # 添加到数据
                                        players_data.append({
                                            "team": team_name,
                                            "team_short": team_short,
                                            "player": player_name,
                                            "player_id": player_name,
                                            "file": filename
                                        })
                                except Exception as e:
                                    print(f"    ✗ 下载失败: {e}")
                            
                        except Exception as e:
                            print(f"  处理选手时出错: {e}")
                            continue
                    
                except Exception as e:
                    print(f"处理战队 {team_name} 时出错: {e}")
                    continue
            
            # 如果上面的方法没找到，尝试直接访问战队详情页
            if len(processed_teams) < len(TARGET_TEAMS):
                print("\n尝试通过API获取战队信息...")
                
                # 尝试从页面中提取战队ID
                team_ids = {}
                page_content = await page.content()
                
                # 常见的战队ID映射（根据历史数据推测）
                team_id_map = {
                    "南京Hero久竞": "25",
                    "苏州KSG": "23"
                }
                
                for team_name in TARGET_TEAMS:
                    if team_name not in processed_teams:
                        team_id = team_id_map.get(team_name)
                        if team_id:
                            print(f"尝试直接访问 {team_name} (ID: {team_id})")
                            
                            # 尝试点击对应战队
                            try:
                                # 查找包含战队名称的链接或按钮
                                team_link = await page.query_selector(f'text={team_name}')
                                if team_link:
                                    await team_link.click()
                                    await asyncio.sleep(2)
                                    
                                    # 重新获取选手
                                    player_items = await page.query_selector_all('.player-item, .member-item, [class*="player"]')
                                    print(f"找到 {len(player_items)} 个选手元素")
                                    
                                    team_short = TEAM_SHORT_NAMES.get(team_name, team_name[:3])
                                    
                                    for idx, item in enumerate(player_items):
                                        try:
                                            # 获取选手名
                                            name_elem = await item.query_selector('.name, .player-name, h3, h4')
                                            if name_elem:
                                                player_name = await name_elem.text_content()
                                                player_name = player_name.strip()
                                                
                                                # 获取头像
                                                img = await item.query_selector('img')
                                                if img:
                                                    img_url = await img.get_attribute('src')
                                                    if img_url:
                                                        if img_url.startswith('//'):
                                                            img_url = 'https:' + img_url
                                                        
                                                        filename = f"{team_short}-{player_name}.png"
                                                        filepath = os.path.join(OUTPUT_DIR, filename)
                                                        
                                                        # 下载
                                                        response = await page.evaluate(f'''
                                                            async () => {{
                                                                const response = await fetch("{img_url}");
                                                                const blob = await response.blob();
                                                                return new Promise((resolve) => {{
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => resolve(reader.result);
                                                                    reader.readAsDataURL(blob);
                                                                }});
                                                            }}
                                                        ''')
                                                        
                                                        if response and ',' in response:
                                                            import base64
                                                            img_data = base64.b64decode(response.split(',')[1])
                                                            with open(filepath, 'wb') as f:
                                                                f.write(img_data)
                                                            print(f"  ✓ {filename}")
                                                            
                                                            players_data.append({
                                                                "team": team_name,
                                                                "team_short": team_short,
                                                                "player": player_name,
                                                                "player_id": player_name,
                                                                "file": filename
                                                            })
                                        except Exception as e:
                                            print(f"  处理选手出错: {e}")
                                    
                                    processed_teams.add(team_name)
                            except Exception as e:
                                print(f"访问 {team_name} 详情页失败: {e}")
            
        except Exception as e:
            print(f"抓取过程出错: {e}")
        
        finally:
            await browser.close()
    
    return players_data


def update_mapping_file(new_players):
    """更新选手映射文件"""
    mapping_file = os.path.join(OUTPUT_DIR, "players_mapping.json")
    
    # 读取现有数据
    existing_data = []
    if os.path.exists(mapping_file):
        try:
            with open(mapping_file, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except:
            pass
    
    # 合并数据
    all_players = existing_data + new_players
    
    # 去重
    seen = set()
    unique_players = []
    for p in all_players:
        key = (p.get('team', ''), p.get('player', ''))
        if key not in seen:
            seen.add(key)
            unique_players.append(p)
    
    # 保存
    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(unique_players, f, ensure_ascii=False, indent=2)
    
    print(f"\n映射文件已更新，共 {len(unique_players)} 名选手")


async def main():
    print("=" * 50)
    print("抓取南京Hero久竞和苏州KSG选手头像")
    print("=" * 50)
    
    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 抓取选手
    players = await fetch_team_players()
    
    print(f"\n抓取完成！共获取 {len(players)} 名选手头像")
    
    # 更新映射文件
    if players:
        update_mapping_file(players)
    
    # 显示结果
    print("\n已抓取的选手:")
    for p in players:
        print(f"  - {p['team']}: {p['player']}")


if __name__ == "__main__":
    asyncio.run(main())
