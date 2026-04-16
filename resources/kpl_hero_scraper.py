#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KPL英雄图片抓取脚本
从KPL官网抓取英雄头像图片
"""

import asyncio
import json
import os
import base64
from playwright.async_api import async_playwright

HEROES_DIR = "heroes"

def ensure_dir():
    os.makedirs(HEROES_DIR, exist_ok=True)

async def scrape_heroes():
    """抓取英雄图片"""
    ensure_dir()
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = await context.new_page()
        
        try:
            print("正在访问KPL官网英雄页面...")
            # 尝试访问英雄列表页面
            await page.goto('https://kpl.qq.com/#/Hero', wait_until='networkidle')
            await page.wait_for_timeout(3000)
            
            print("正在提取英雄图片...")
            
            # 提取英雄头像
            hero_images = await page.evaluate('''() => {
                const heroes = [];
                const heroElements = document.querySelectorAll('img[src*="hero"], .hero-icon img, [class*="hero"] img');
                heroElements.forEach((img, index) => {
                    if (img.src && img.src.startsWith('http')) {
                        heroes.push({
                            index: index,
                            src: img.src,
                            alt: img.alt || '',
                            className: img.className || ''
                        });
                    }
                });
                return heroes;
            }''')
            
            print(f"找到 {len(hero_images)} 个英雄图片")
            
            # 保存数据
            with open('kpl_heroes_data.json', 'w', encoding='utf-8') as f:
                json.dump(hero_images, f, ensure_ascii=False, indent=2)
            
            # 下载英雄图片
            for i, hero in enumerate(hero_images[:50]):  # 限制下载数量
                try:
                    ext = hero['src'].split('.')[-1].split('?')[0][:4] or 'jpg'
                    filename = f"{HEROES_DIR}/hero_{i:03d}.{ext}"
                    
                    result = await page.evaluate(f'''
                        async () => {{
                            try {{
                                const response = await fetch("{hero['src']}");
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
                        data = result.split(',')[1]
                        with open(filename, 'wb') as f:
                            f.write(base64.b64decode(data))
                        print(f"  [OK] 已下载: {filename}")
                    else:
                        print(f"  [FAIL] 下载失败: {hero['src'][:50]}...")
                        
                except Exception as e:
                    print(f"  [ERROR] 下载出错: {str(e)}")
            
            print("\n[OK] 英雄图片抓取完成！")
            
        except Exception as e:
            print(f"\n[ERROR] 抓取出错: {str(e)}")
        
        finally:
            await browser.close()

if __name__ == "__main__":
    print("=" * 60)
    print("KPL英雄图片抓取工具")
    print("=" * 60)
    asyncio.run(scrape_heroes())
