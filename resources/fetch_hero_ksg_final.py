#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
抓取南通Hero久竞和苏州KSG的选手头像 - 最终版
通过分析页面结构和图片特征来识别选手
"""

import asyncio
import json
import os
import base64
import re
from playwright.async_api import async_playwright

# 输出目录
OUTPUT_DIR = r"D:\project_data\html小游戏\王者荣耀比赛\resources\players_by_team"

# 已知的Hero和KSG选手名单（根据KPL官网常见选手）
KNOWN_PLAYERS = {
    "Hero": ["无畏", "傲寒", "铃铛", "星痕", "久酷", "誓约", "秋沫", "夏凌", "小离", "景晚", "阿豆", "江城"],
    "KSG": ["妖刀", "今屿", "流浪", "轻语", "子阳", "久酷", "啊泽", "一曲", "小玖", "晚星"]
}

async def fetch_team_players_final():
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
            
            # 战队映射（页面显示名称 -> 简称）
            team_mapping = [
                ("南通Hero久竞", "Hero"),
                ("KSG", "KSG"),
                ("苏州KSG", "KSG")
            ]
            
            for team_display_name, team_short in team_mapping:
                # 跳过已处理的战队
                if any(p['team_short'] == team_short for p in players_data):
                    continue
                
                print(f"\n{'='*50}")
                print(f"处理战队: {team_display_name} ({team_short})")
                print(f"{'='*50}")
                
                # 点击战队
                clicked = False
                try:
                    # 尝试查找并点击战队名称
                    elements = await page.query_selector_all(f'//*[contains(text(), "{team_display_name}")]')
                    for elem in elements:
                        try:
                            await elem.click()
                            clicked = True
                            print(f"已点击: {team_display_name}")
                            await asyncio.sleep(2)
                            break
                        except:
                            pass
                except Exception as e:
                    print(f"点击失败: {e}")
                
                if not clicked:
                    continue
                
                # 获取页面HTML内容分析
                html_content = await page.content()
                
                # 获取所有图片元素及其信息
                img_info_list = await page.evaluate('''() => {
                    const imgs = document.querySelectorAll('img');
                    const result = [];
                    imgs.forEach(img => {
                        const rect = img.getBoundingClientRect();
                        // 只取可见的、尺寸合适的图片（头像通常是正方形，尺寸在60-150px之间）
                        if (rect.width >= 50 && rect.width <= 200 && rect.height >= 50 && rect.height <= 200) {
                            result.push({
                                src: img.src,
                                alt: img.alt || '',
                                width: rect.width,
                                height: rect.height,
                                parentText: img.parentElement ? img.parentElement.textContent.substring(0, 100) : ''
                            });
                        }
                    });
                    return result;
                }''')
                
                print(f"找到 {len(img_info_list)} 个可能的头像图片")
                
                # 处理每个图片
                team_players = []
                for img_info in img_info_list:
                    src = img_info.get('src', '')
                    alt = img_info.get('alt', '')
                    parent_text = img_info.get('parentText', '')
                    
                    if not src:
                        continue
                    
                    # 尝试从alt获取选手名
                    player_name = None
                    
                    # 方法1: alt属性
                    if alt and 2 <= len(alt) <= 4:
                        if re.match(r'^[\u4e00-\u9fa5]{2,4}$', alt):
                            player_name = alt
                    
                    # 方法2: 从父元素文本中提取
                    if not player_name and parent_text:
                        # 尝试匹配已知的选手名
                        for known in KNOWN_PLAYERS.get(team_short, []):
                            if known in parent_text:
                                player_name = known
                                break
                        
                        # 如果没找到，尝试提取2-4个汉字的名称
                        if not player_name:
                            matches = re.findall(r'[\u4e00-\u9fa5]{2,4}', parent_text)
                            for m in matches:
                                if m not in ['英雄池', '赛季表现', '对抗路', '发育路', '中路', '打野', '游走', '登场']:
                                    player_name = m
                                    break
                    
                    if player_name:
                        # 检查是否已存在
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
                                img_data = base64.b64decode(response.split(',')[1])
                                with open(filepath, 'wb') as f:
                                    f.write(img_data)
                                print(f"    [OK] {filename}")
                                
                                team_players.append({
                                    "team": team_display_name if "苏州" in team_display_name or "南通" in team_display_name else f"苏州{team_display_name}" if team_short == "KSG" else f"南通{team_display_name}",
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
    print("抓取南通Hero久竞和苏州KSG选手头像")
    print("=" * 60)
    
    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 抓取选手
    players = await fetch_team_players_final()
    
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
