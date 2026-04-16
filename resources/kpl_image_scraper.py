#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KPL官网图片抓取脚本
使用Playwright获取战队Logo和选手头像
"""

import asyncio
import json
import os
from playwright.async_api import async_playwright

# 创建目录
TEAMS_DIR = "teams"
PLAYERS_DIR = "players"

def ensure_dirs():
    os.makedirs(TEAMS_DIR, exist_ok=True)
    os.makedirs(PLAYERS_DIR, exist_ok=True)

async def scrape_kpl_images():
    """抓取KPL官网图片"""
    ensure_dirs()
    
    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = await context.new_page()
        
        try:
            print("正在访问KPL官网...")
            await page.goto('https://kpl.qq.com/#/Teams', wait_until='networkidle')
            
            # 等待页面加载完成
            await page.wait_for_timeout(3000)
            
            print("正在提取图片数据...")
            
            # 提取战队Logo
            team_logos = await page.evaluate('''() => {
                const logos = [];
                const teamElements = document.querySelectorAll('img[src*="team"], img[alt*="战队"], .team-logo img, [class*="team"] img');
                teamElements.forEach((img, index) => {
                    if (img.src && img.src.startsWith('http')) {
                        logos.push({
                            index: index,
                            src: img.src,
                            alt: img.alt || '',
                            className: img.className || ''
                        });
                    }
                });
                return logos;
            }''')
            
            print(f"\n找到 {len(team_logos)} 个战队Logo:")
            for logo in team_logos:
                print(f"  [{logo['index']}] {logo['alt']}: {logo['src'][:80]}...")
            
            # 提取选手头像
            player_avatars = await page.evaluate('''() => {
                const avatars = [];
                const playerElements = document.querySelectorAll('img[src*="player"], img[alt*="选手"], .player-avatar img, [class*="player"] img, img[src*="avatar"]');
                playerElements.forEach((img, index) => {
                    if (img.src && img.src.startsWith('http')) {
                        avatars.push({
                            index: index,
                            src: img.src,
                            alt: img.alt || '',
                            className: img.className || ''
                        });
                    }
                });
                return avatars;
            }''')
            
            print(f"\n找到 {len(player_avatars)} 个选手头像:")
            for avatar in player_avatars[:10]:  # 只显示前10个
                print(f"  [{avatar['index']}] {avatar['alt']}: {avatar['src'][:80]}...")
            if len(player_avatars) > 10:
                print(f"  ... 还有 {len(player_avatars) - 10} 个头像")
            
            # 保存数据到JSON
            data = {
                'team_logos': team_logos,
                'player_avatars': player_avatars
            }
            
            with open('kpl_images_data.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print("\n[OK] 图片数据已保存到 kpl_images_data.json")
            
            # 尝试下载图片
            print("\n开始下载图片...")
            
            # 下载战队Logo
            for i, logo in enumerate(team_logos):
                try:
                    ext = logo['src'].split('.')[-1].split('?')[0][:4] or 'png'
                    filename = f"{TEAMS_DIR}/team_{i:02d}_{logo['alt'][:20] or 'logo'}.{ext}"
                    
                    # 使用page.evaluate下载
                    result = await page.evaluate(f'''
                        async () => {{
                            try {{
                                const response = await fetch("{logo['src']}");
                                const blob = await response.blob();
                                const reader = new FileReader();
                                return new Promise((resolve) => {{
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.readAsDataURL(blob);
                                }});
                            }} catch (e) {{
                                return null;
                            }}
                        }}
                    ''')
                    
                    if result:
                        # 解码base64并保存
                        import base64
                        data = result.split(',')[1]
                        with open(filename, 'wb') as f:
                            f.write(base64.b64decode(data))
                        print(f"  [OK] 已下载: {filename}")
                    else:
                        print(f"  [FAIL] 下载失败: {logo['src'][:50]}...")
                        
                except Exception as e:
                    print(f"  [ERROR] 下载出错: {str(e)}")
            
            # 下载选手头像（前20个）
            for i, avatar in enumerate(player_avatars[:20]):
                try:
                    ext = avatar['src'].split('.')[-1].split('?')[0][:4] or 'png'
                    safe_name = "".join(c for c in (avatar['alt'][:20] or 'avatar') if c.isalnum() or c in ('_', '-'))
                    filename = f"{PLAYERS_DIR}/player_{i:02d}_{safe_name}.{ext}"
                    
                    result = await page.evaluate(f'''
                        async () => {{
                            try {{
                                const response = await fetch("{avatar['src']}");
                                const blob = await response.blob();
                                const reader = new FileReader();
                                return new Promise((resolve) => {{
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.readAsDataURL(blob);
                                }});
                            }} catch (e) {{
                                return null;
                            }}
                        }}
                    ''')
                    
                    if result:
                        import base64
                        data = result.split(',')[1]
                        with open(filename, 'wb') as f:
                            f.write(base64.b64decode(data))
                        print(f"  [OK] 已下载: {filename}")
                    else:
                        print(f"  [FAIL] 下载失败: {avatar['src'][:50]}...")
                        
                except Exception as e:
                    print(f"  [ERROR] 下载出错: {str(e)}")
            
            print("\n[OK] 图片抓取完成！")
            
        except Exception as e:
            print(f"\n[ERROR] 抓取出错: {str(e)}")
            import traceback
            traceback.print_exc()
        
        finally:
            await browser.close()

if __name__ == "__main__":
    print("=" * 60)
    print("KPL官网图片抓取工具")
    print("=" * 60)
    
    # 检查playwright是否安装
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("\n请先安装Playwright:")
        print("  pip install playwright")
        print("  playwright install chromium")
        exit(1)
    
    asyncio.run(scrape_kpl_images())
