#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
通过KPL API获取Hero和KSG选手头像
"""

import asyncio
import json
import os
import base64
import requests
from playwright.async_api import async_playwright

# 输出目录
OUTPUT_DIR = r"D:\project_data\html小游戏\王者荣耀比赛\resources\players_by_team"

# 战队信息
TEAMS = {
    "Hero": {"name": "南通Hero久竞", "id": "25"},
    "KSG": {"name": "苏州KSG", "id": "23"}
}

async def fetch_from_kpl_api():
    """从KPL API获取选手信息"""
    
    players_data = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = await context.new_page()
        
        try:
            print("正在访问KPL官网获取数据...")
            await page.goto('https://kpl.qq.com/#/Teams', wait_until='networkidle', timeout=60000)
            await asyncio.sleep(3)
            
            # 监听网络请求，获取API数据
            team_rosters = {}
            
            for team_short, team_info in TEAMS.items():
                team_name = team_info["name"]
                print(f"\n{'='*50}")
                print(f"处理战队: {team_name} ({team_short})")
                print(f"{'='*50}")
                
                # 点击战队
                try:
                    # 尝试不同的名称匹配
                    search_names = [team_name, team_short, team_name.replace("南通", "").replace("苏州", "")]
                    clicked = False
                    
                    for search_name in search_names:
                        if clicked:
                            break
                        try:
                            elements = await page.query_selector_all(f'//*[contains(text(), "{search_name}")]')
                            for elem in elements:
                                try:
                                    await elem.click()
                                    clicked = True
                                    print(f"已点击: {search_name}")
                                    await asyncio.sleep(2)
                                    break
                                except:
                                    pass
                        except:
                            pass
                    
                    if not clicked:
                        print(f"无法点击战队 {team_name}")
                        continue
                    
                    # 获取页面上的所有文本，分析选手信息
                    page_text = await page.evaluate('() => document.body.innerText')
                    
                    # 获取所有图片及其上下文
                    img_data = await page.evaluate('''() => {
                        const results = [];
                        const imgs = document.querySelectorAll('img');
                        imgs.forEach(img => {
                            const rect = img.getBoundingClientRect();
                            // 头像通常是正方形，尺寸适中
                            if (rect.width >= 60 && rect.width <= 180 && rect.height >= 60 && rect.height <= 180) {
                                // 获取周围的文本
                                let context = '';
                                let elem = img.parentElement;
                                for (let i = 0; i < 3 && elem; i++) {
                                    context += elem.textContent + ' ';
                                    elem = elem.parentElement;
                                }
                                results.push({
                                    src: img.src,
                                    alt: img.alt || '',
                                    context: context.substring(0, 200)
                                });
                            }
                        });
                        return results;
                    }''')
                    
                    print(f"找到 {len(img_data)} 个候选头像")
                    
                    # 分析每个图片的上下文来识别选手
                    team_players = []
                    for item in img_data:
                        src = item.get('src', '')
                        alt = item.get('alt', '')
                        context = item.get('context', '')
                        
                        if not src:
                            continue
                        
                        # 从alt或上下文中提取选手名
                        player_name = None
                        
                        # 方法1: alt属性
                        if alt and 2 <= len(alt) <= 4:
                            import re
                            if re.match(r'^[\u4e00-\u9fa5]{2,4}$', alt):
                                # 排除常见非选手词汇
                                if alt not in ['英雄池', '赛季表现', '对抗路', '发育路', '中路', '打野', '游走']:
                                    player_name = alt
                        
                        # 方法2: 从上下文中提取
                        if not player_name and context:
                            import re
                            # 匹配模式：选手名（真名）位置
                            matches = re.findall(r'([\u4e00-\u9fa5]{2,4})[（(][\u4e00-\u9fa5]{2,4}[）)]\s*(对抗路|发育路|中路|打野|游走)', context)
                            if matches:
                                player_name = matches[0][0]
                            else:
                                # 尝试其他模式
                                matches = re.findall(r'([\u4e00-\u9fa5]{2,4})\s*(对抗路|发育路|中路|打野|游走)', context)
                                if matches:
                                    player_name = matches[0][0]
                        
                        if player_name:
                            # 去重
                            if any(p['player'] == player_name for p in team_players):
                                continue
                            
                            print(f"  选手: {player_name}")
                            
                            # 处理URL
                            if src.startswith('//'):
                                src = 'https:' + src
                            
                            # 下载图片
                            filename = f"{team_short}-{player_name}.png"
                            filepath = os.path.join(OUTPUT_DIR, filename)
                            
                            try:
                                response = await page.evaluate(f'''
                                    async () => {{
                                        try {{
                                            const response = await fetch("{src}");
                                            if (!response.ok) return null;
                                            const blob = await response.blob();
                                            return new Promise((resolve) => {{
                                                const reader = new FileReader();
                                                reader.onloadend = () => resolve(reader.result);
                                                reader.readAsDataURL(blob);
                                            }});
                                        }} catch (e) {{
                                            return null;
                                        }}
                                    }}
                                ''')
                                
                                if response and ',' in response:
                                    img_data_decoded = base64.b64decode(response.split(',')[1])
                                    with open(filepath, 'wb') as f:
                                        f.write(img_data_decoded)
                                    print(f"    [OK] {filename}")
                                    
                                    team_players.append({
                                        "team": team_name,
                                        "team_short": team_short,
                                        "player": player_name,
                                        "player_id": player_name,
                                        "file": filename
                                    })
                                else:
                                    print(f"    [FAIL] 下载失败")
                            except Exception as e:
                                print(f"    [ERROR] {e}")
                    
                    players_data.extend(team_players)
                    print(f"战队 {team_short} 共抓取 {len(team_players)} 名选手")
                    
                except Exception as e:
                    print(f"处理战队 {team_name} 时出错: {e}")
                    import traceback
                    traceback.print_exc()
            
        except Exception as e:
            print(f"抓取过程出错: {e}")
            import traceback
            traceback.print_exc()
        
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
        key = (p.get('team_short', ''), p.get('player', ''))
        if key not in seen:
            seen.add(key)
            unique_players.append(p)
    
    # 保存
    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(unique_players, f, ensure_ascii=False, indent=2)
    
    print(f"\n映射文件已更新，共 {len(unique_players)} 名选手")


async def main():
    print("=" * 60)
    print("抓取Hero和KSG选手头像")
    print("=" * 60)
    
    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 抓取选手
    players = await fetch_from_kpl_api()
    
    print(f"\n{'='*60}")
    print(f"抓取完成！共获取 {len(players)} 名选手头像")
    print(f"{'='*60}")
    
    # 更新映射文件
    if players:
        update_mapping_file(players)
        
        # 按战队分组显示
        print("\n已抓取的选手:")
        current_team = None
        for p in sorted(players, key=lambda x: x['team_short']):
            if p['team_short'] != current_team:
                current_team = p['team_short']
                print(f"\n  [{current_team}]")
            print(f"    - {p['player']}")
    else:
        print("\n未能抓取到选手头像")


if __name__ == "__main__":
    asyncio.run(main())
