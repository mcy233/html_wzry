# AI音效生成提示词指南（统一电竞风格版）

> 使用AI音频生成工具生成统一电竞风格的音效，强调竞技感、科技感和冲击力

---

## 一、风格定义

### 统一风格关键词

所有音效必须体现以下核心特征：

| 特征 | 描述 | 技术表现 |
|------|------|----------|
| **竞技感** | 紧张、激烈、对抗 | 重低音、强节奏、冲击力 |
| **科技感** | 未来、数字、电子 | 合成器音色、数字处理、电子元素 |
| **冲击力** | 有力、干脆、明确 | 短促 attack、清晰 transient |
| **现代电竞** | 参考LOL、Valorant、KPL赛事 | 商业化游戏音效质感 |

### 统一技术规格

```
风格基调: 现代电子竞技游戏音效
音色特征: 电子合成 + 轻微失真 + 数字处理
频率侧重: 中低频为主（200Hz-2kHz），高频点缀
空间感: 干声为主，极少混响（<0.3秒）
动态: 高压缩，响度统一
```

---

## 二、推荐的AI音效生成工具

| 工具 | 特点 | 网址 | 免费额度 |
|------|------|------|---------|
| **ElevenLabs Sound Effects** | 质量最高，电竞音效表现力强 | elevenlabs.io | 每月10,000字符 |
| **Stable Audio** | 专业级，适合复杂音效 | stableaudio.com | 每月20次生成 |
| **Meta Audiobox** | 多种音效类型，易用 | audiobox.metademolab.com | 免费 |

**推荐**: ElevenLabs Sound Effects

---

## 三、UI音效生成提示词（18个）

### 核心规则

每个提示词必须包含：
1. **"esports"** 或 **"competitive gaming"** 关键词
2. **"electronic"** 或 **"digital"** 关键词
3. 明确的时长（秒）
4. 统一的风格描述

---

### 基础交互音效

#### 1. click.mp3 - 通用点击
```
Esports competitive gaming UI click sound, sharp electronic digital blip, 
high-tech button press, short and punchy 0.1 seconds, 
strong transient attack, clean cutoff, no reverb, dry signal, 
modern esports interface aesthetic, similar to Valorant or League of Legends UI
```

**中文理解**: 电竞竞技游戏UI点击音效，尖锐电子数字哔声，高科技按钮按下，短促有力0.1秒，强瞬态attack，干净截止，无混响，现代电竞界面美学，类似Valorant或LOL风格

---

#### 2. hover.mp3 - 悬浮高亮
```
Esports competitive gaming UI hover sound, subtle electronic sweep, 
very short 0.15 seconds, high-frequency digital shimmer, 
minimal and precise, futuristic interface feedback, 
soft attack quick decay, no reverb, clean esports aesthetic
```

**中文理解**: 电竞竞技游戏UI悬浮音效，微妙电子扫过，极短0.15秒，高频数字微光，极简精准，未来界面反馈，软attack快衰减，无混响，干净电竞美学

---

#### 3. confirm.mp3 - 确认操作
```
Esports competitive gaming confirmation sound, ascending electronic power-up, 
0.4 seconds, strong bass foundation with bright high-end, 
digital processing, satisfying impact, modern esports positive feedback, 
compressed dynamics, punchy and clear
```

**中文理解**: 电竞竞技游戏确认音效，上升电子power-up，0.4秒，强低音基础配明亮高频，数字处理，令人满意的冲击，现代电竞正向反馈，压缩动态，有力清晰

---

#### 4. cancel.mp3 - 取消/返回
```
Esports competitive gaming cancel sound, descending electronic tone, 
0.35 seconds, digital falloff with subtle distortion, 
negative feedback but not harsh, modern esports interface, 
clean cutoff, minimal reverb, professional game audio quality
```

**中文理解**: 电竞竞技游戏取消音效，下降电子音调，0.35秒，数字衰减带微妙失真，负面反馈但不刺耳，现代电竞界面，干净截止，极少混响，专业游戏音频质量

---

#### 5. navigate.mp3 - 场景切换
```
Esports competitive gaming transition whoosh, electronic sweep with impact, 
0.5 seconds, strong mid-frequency movement, digital processing, 
quick attack and decay, modern esports scene change, 
clean and punchy, no reverb tail
```

**中文理解**: 电竞竞技游戏过渡嗖声，电子扫过带冲击，0.5秒，强中频运动，数字处理，快attack和衰减，现代电竞场景切换，干净有力，无混响尾音

---

### 抽卡/奖励音效

#### 6. card-flip.mp3 - 抽卡翻牌
```
Esports competitive gaming card flip sound, digital paper texture, 
0.4 seconds, electronic enhancement, crisp and tactile, 
strong transient, modern game card reveal, 
clean attack, minimal processing, esports loot box aesthetic
```

**中文理解**: 电竞竞技游戏卡牌翻转音效，数字纸张质感，0.4秒，电子增强，清脆有触感，强瞬态，现代游戏卡牌揭晓，干净attack，极少处理，电竞战利品箱美学

---

#### 7. r-reveal.mp3 - R卡出现（普通）
```
Esports competitive gaming common item reveal, simple digital pop, 
0.6 seconds, electronic blip with subtle sparkle, 
straightforward and clean, modern esports loot reveal, 
compressed dynamics, clear transient, minimal reverb
```

**中文理解**: 电竞竞技游戏普通物品揭晓，简单数字弹出，0.6秒，电子哔声带微妙闪光，直接干净，现代电竞战利品揭晓，压缩动态，清晰瞬态，极少混响

---

#### 8. sr-reveal.mp3 - SR卡出现（稀有）
```
Esports competitive gaming rare item reveal, electronic crystal shimmer, 
1.0 seconds, digital magic effect, strong presence, 
modern esports gacha sound, purple energy aesthetic, 
clear attack, satisfying sustain, professional game audio
```

**中文理解**: 电竞竞技游戏稀有物品揭晓，电子水晶闪光，1.0秒，数字魔法效果，强存在感，现代电竞抽卡音效，紫色能量美学，清晰attack，令人满意的持续，专业游戏音频

---

#### 9. ssr-reveal.mp3 - SSR卡出现（传说）
```
Esports competitive gaming legendary reveal, massive electronic impact, 
2.0 seconds, heavy bass drop with digital choir, 
explosive attack, modern esports ultimate reward, 
golden energy aesthetic, highly compressed, cinematic esports quality, 
epic and satisfying climax
```

**中文理解**: 电竞竞技游戏传说揭晓，宏大电子冲击，2.0秒，重低音drop配数字合唱，爆发attack，现代电竞终极奖励，金色能量美学，高度压缩，电影级电竞质量，史诗令人满意的高潮

---

### 升级/成长音效

#### 10. level-up.mp3 - 选手升级
```
Esports competitive gaming level up sound, ascending electronic power surge, 
1.2 seconds, strong bass with bright high-end sparkle, 
digital processing, modern RPG progression, 
compressed and punchy, clear transient attack, esports game aesthetic
```

**中文理解**: 电竞竞技游戏升级音效，上升电子力量涌动，1.2秒，强低音配明亮高频闪光，数字处理，现代RPG进阶，压缩有力，清晰瞬态attack，电竞游戏美学

---

#### 11. star-up.mp3 - 升星
```
Esports competitive gaming rank up sound, electronic power burst, 
1.5 seconds, strong impact with digital ring, 
expanding stereo field, modern esports ranking system, 
heavy compression, satisfying punch, professional game audio
```

**中文理解**: 电竞竞技游戏升星音效，电子力量爆发，1.5秒，强冲击带数字回响，扩展立体声场，现代电竞排位系统，重压缩，令人满意的冲击，专业游戏音频

---

### 战斗音效

#### 12. battle-start.mp3 - 比赛开始
```
Esports competitive gaming match start sound, electronic war horn, 
1.8 seconds, heavy bass with digital drum impact, 
strong attack, modern esports competition begin, 
compressed dynamics, punchy and intense, arena aesthetic
```

**中文理解**: 电竞竞技游戏比赛开始音效，电子战争号角，1.8秒，重低音配数字鼓冲击，强attack，现代电竞比赛开始，压缩动态，有力紧张，竞技场美学

---

#### 13. kill.mp3 - 击杀播报
```
Esports competitive gaming kill confirmation, sharp electronic impact, 
0.4 seconds, metallic digital ring, strong transient, 
modern MOBA elimination sound, clean attack quick decay, 
no reverb, dry and punchy, esports broadcast quality
```

**中文理解**: 电竞竞技游戏击杀确认，尖锐电子冲击，0.4秒，金属数字回响，强瞬态，现代MOBA淘汰音效，干净attack快衰减，无混响，干声有力，电竞广播质量

---

#### 14. tower.mp3 - 推塔
```
Esports competitive gaming objective destruction, heavy electronic explosion, 
1.2 seconds, digital debris with bass impact, 
strong presence, modern MOBA tower destroy, 
compressed dynamics, satisfying destruction feel, esports game quality
```

**中文理解**: 电竞竞技游戏目标摧毁，沉重电子爆炸，1.2秒，数字碎片带低音冲击，强存在感，现代MOBA防御塔摧毁，压缩动态，令人满意的摧毁感，电竞游戏质量

---

### 胜负音效

#### 15. victory-sting.mp3 - 胜利瞬间
```
Esports competitive gaming victory sound, triumphant electronic brass, 
2.5 seconds, heavy bass with digital orchestral hit, 
explosive attack, modern esports win celebration, 
highly compressed, epic and uplifting, gold medal aesthetic, 
cinematic esports quality
```

**中文理解**: 电竞竞技游戏胜利音效，凯旋电子铜管，2.5秒，重低音配数字管弦乐冲击，爆发attack，现代电竞胜利庆祝，高度压缩，史诗振奋，金牌美学，电影级电竞质量

---

#### 16. defeat-sting.mp3 - 失败瞬间
```
Esports competitive gaming defeat sound, low electronic brass, 
2.0 seconds, digital strings with subtle distortion, 
somber but professional, modern esports loss, 
controlled dynamics, clean production, sportsmanlike aesthetic
```

**中文理解**: 电竞竞技游戏失败音效，低电子铜管，2.0秒，数字弦乐带微妙失真，阴郁但专业，现代电竞失败，控制动态，干净制作，体育精神美学

---

### 其他音效

#### 17. coin.mp3 - 获得金币
```
Esports competitive gaming currency pickup, electronic coin chime, 
0.35 seconds, digital metallic ring with sparkle, 
short and satisfying, modern game money sound, 
clean transient, no reverb, dry signal, esports interface quality
```

**中文理解**: 电竞竞技游戏货币拾取，电子硬币钟声，0.35秒，数字金属回响带闪光，短促令人满意，现代游戏金钱音效，干净瞬态，无混响，干信号，电竞界面质量

---

#### 18. crowd-cheer.mp3 - 关键欢呼
```
Esports competitive gaming crowd reaction, digital audience cheer, 
3.5 seconds, processed stadium ambience, electronic enhancement, 
modern esports arena atmosphere, compressed dynamics, 
clear and punchy, professional broadcast quality
```

**中文理解**: 电竞竞技游戏观众反应，数字观众欢呼，3.5秒，处理过的体育场氛围，电子增强，现代电竞竞技场氛围，压缩动态，清晰有力，专业广播质量

---

## 四、氛围音效生成提示词（3个）

### 氛围音效风格定义

氛围音效同样需要保持电竞风格，但更注重**背景感**和**循环性**：

```
风格基调: 电竞场馆/设施环境音
音色特征: 电子低频嗡鸣 + 数字处理 + 微妙人声
频率侧重: 低频为主（<500Hz），极低存在感
空间感: 中等混响（模拟场馆）
动态: 极度压缩，几乎无变化（适合循环）
```

---

### 1. arena-hum.mp3 - 场馆底噪
```
Esports competitive gaming arena ambient sound, electronic venue hum, 
45 seconds seamless loop, low-frequency digital drone, 
subtle crowd murmur processed, computer equipment buzz, 
modern esports stadium atmosphere, minimal dynamics, 
consistent level, professional broadcast ambience
```

**中文理解**: 电竞竞技游戏场馆环境音效，电子场馆嗡鸣，45秒无缝循环，低频数字drone，处理的微妙人群低语，电脑设备嗡嗡声，现代电竞体育场氛围，极小动态，一致电平，专业广播环境音

**生成要点**:
- 时长：45-60秒
- 必须可无缝循环
- 音量：-25dB（极低，作为背景）
- 风格：电竞场馆，非真实录音

---

### 2. city-ambient.mp3 - 城市环境
```
Esports competitive gaming city ambient sound, digital urban atmosphere, 
45 seconds seamless loop, electronic traffic hum, 
processed crowd distant, subtle wind digital, 
modern esports city exploration, low-frequency focus, 
minimal variation, professional game ambience
```

**中文理解**: 电竞竞技游戏城市环境音效，数字城市氛围，45秒无缝循环，电子交通嗡鸣，处理的远处人群，微妙数字风声，现代电竞城市探索，低频聚焦，极小变化，专业游戏环境音

**生成要点**:
- 时长：45-60秒
- 必须可无缝循环
- 音量：-20dB
- 风格：电竞游戏城市，非真实城市录音

---

### 3. base-ambient.mp3 - 基地环境
```
Esports competitive gaming base ambient sound, high-tech facility hum, 
45 seconds seamless loop, electronic server room drone, 
digital equipment buzz, subtle keyboard clicks processed, 
modern esports team headquarters, low-frequency consistent, 
professional gaming facility atmosphere
```

**中文理解**: 电竞竞技游戏基地环境音效，高科技设施嗡鸣，45秒无缝循环，电子服务器机房drone，数字设备嗡嗡声，处理的微妙键盘敲击，现代电竞战队总部，低频一致，专业游戏设施氛围

**生成要点**:
- 时长：45-60秒
- 必须可无缝循环
- 音量：-25dB（极低）
- 风格：电竞战队基地，科技感

---

## 五、提示词使用技巧

### 5.1 必须包含的关键词

每个提示词必须出现以下至少2个：
- `esports` 或 `competitive gaming`
- `electronic` 或 `digital`
- `modern` 或 `professional`

### 5.2 推荐参考游戏

可在提示词中加入作为风格参考：
- `similar to Valorant`（瓦罗兰特，FPS电竞风格）
- `similar to League of Legends`（英雄联盟，MOBA电竞风格）
- `similar to CS:GO`（CSGO，竞技射击风格）

### 5.3 技术参数规范

| 参数 | UI音效 | 氛围音效 |
|------|--------|----------|
| 混响 | 无/dry | 中等（模拟空间） |
| 压缩 | 高压缩 | 极高压缩 |
| 动态 | 大动态（冲击感） | 极小动态（稳定） |
| 频率 | 中低频为主 | 低频为主 |

---

## 六、生成后统一处理

### 6.1 使用Audacity统一处理

```
1. 导入所有生成的音效
2. 效果 → 标准化:
   - 峰值幅度: -3.0 dB
   - 移除DC偏移: 是
3. 效果 → 压缩器:
   - 阈值: -20 dB
   - 比率: 4:1
   - 攻击时间: 0.1 ms
   - 释放时间: 100 ms
4. 导出为 MP3:
   - 比特率: 96 kbps
   - 声道: 单声道
```

### 6.2 氛围音效特殊处理

```
1. 确保首尾可循环:
   - 选中结尾0.5秒 → 复制
   - 粘贴到开头做交叉淡化
2. 音量调整:
   - arena-hum: -25 dB
   - city-ambient: -20 dB
   - base-ambient: -25 dB
```

---

## 七、质量检查清单

生成并处理完所有音效后，检查：

- [ ] 所有21个音效都存在
- [ ] 所有音效都体现电竞风格（电子、竞技、冲击）
- [ ] 风格统一，听起来像来自同一款游戏
- [ ] UI音效时长正确（0.1-2.5秒）
- [ ] 氛围音效可无缝循环
- [ ] 音量统一（没有忽大忽小）
- [ ] 格式为 MP3，96kbps，单声道
- [ ] 总大小 < 2MB
- [ ] 在游戏中测试，风格一致

---

## 八、参考示例

### 优秀参考

| 游戏 | 参考音效 | 特点 |
|------|----------|------|
| Valorant | UI点击、确认 | 干净、有力、现代 |
| League of Legends | 胜利、升级 | 史诗、压缩、专业 |
| CS:GO | 击杀、回合开始 | 干脆、明确、竞技 |
| Apex Legends | 拾取、升级 | 科幻、电子、冲击 |

### 避免的音效风格

- ❌ 卡通/可爱风格（太软）
- ❌ 真实录音（缺乏统一感）
- ❌ 古典/管弦（不够现代）
- ❌ 8-bit/复古（不够精致）

---

*使用本指南生成的音效将具有统一的现代电竞竞技风格*
