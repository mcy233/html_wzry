/**
 * TrainingScene - 训练基地
 * 包含多个训练小游戏，提升选手属性
 */
import { game } from '../core/GameEngine.js';
import { getTeamById } from '../data/teams.js';
import { createElement, showToast } from '../ui/Components.js';
import { staggerIn } from '../ui/Transitions.js';
import { ECONOMY, TRAINING } from '../data/balance.js';

export class TrainingScene {
    async enter(container) {
        this._container = container;
        const teamId = game.getState('teamId');
        this._team = getTeamById(teamId);
        this._players = game.state.players?.length ? game.state.players : this._team.players;
        container.className = 'scene scene--training';
        this._renderMain();
    }

    exit() { this._container = null; }

    _renderMain() {
        const c = this._container;
        c.innerHTML = `
            <div class="training">
                <header class="training__header">
                    <button class="btn btn--outline btn--small" id="btn-back">← 返回基地</button>
                    <h2>🏋️ 训练基地</h2>
                    <span class="training__gold">金币: ${game.state.team.gold}</span>
                </header>
                <p class="training__tip">选择一个训练项目，通过小游戏提升选手能力（每次消耗 50 金币）</p>
                <div class="training__grid" id="training-grid"></div>
            </div>`;
        c.querySelector('#btn-back').addEventListener('click', () => game.sceneManager.switchTo('home'));

        const items = [
            { id: 'reflex',   icon: '⚡', name: '手速挑战',   desc: '连续点击目标，训练操作能力', stat: '操作', cost: 50 },
            { id: 'memory',   icon: '🧠', name: '记忆矩阵',   desc: '记住并复现序列，训练意识',   stat: '意识', cost: 50 },
            { id: 'rhythm',   icon: '🎯', name: '节奏打击',   desc: '按节奏击中目标，训练对线',   stat: '对线', cost: 50 },
            { id: 'teamwork', icon: '🤝', name: '团队默契',   desc: '快速配对连线，训练配合',     stat: '配合', cost: 50 },
        ];

        const grid = c.querySelector('#training-grid');
        items.forEach(item => {
            const card = createElement('button', 'training-card');
            card.innerHTML = `
                <span class="training-card__icon">${item.icon}</span>
                <span class="training-card__name">${item.name}</span>
                <span class="training-card__desc">${item.desc}</span>
                <span class="training-card__stat">提升: ${item.stat}</span>
                <span class="training-card__cost">💰 ${item.cost}</span>`;
            card.addEventListener('click', () => this._startTraining(item));
            grid.appendChild(card);
        });
        staggerIn([...grid.children], 80);
    }

    _startTraining(item) {
        if (game.state.team.gold < item.cost) {
            showToast('金币不足！');
            return;
        }
        switch (item.id) {
            case 'reflex': this._reflexGame(item); break;
            case 'memory': this._memoryGame(item); break;
            case 'rhythm': this._rhythmGame(item); break;
            case 'teamwork': this._teamworkGame(item); break;
        }
    }

    /* ========== 手速挑战 ========== */
    _reflexGame(item) {
        const c = this._container;
        let score = 0, total = 15, timeLeft = 8;
        c.innerHTML = `
            <div class="minigame">
                <div class="minigame__hud">
                    <span>得分: <strong id="mg-score">0</strong> / ${total}</span>
                    <span>时间: <strong id="mg-time">${timeLeft}</strong>s</span>
                </div>
                <div class="minigame__area" id="mg-area" style="position:relative;height:360px;background:var(--color-surface);border-radius:var(--radius-lg);overflow:hidden;cursor:crosshair;"></div>
                <p class="minigame__hint">点击出现的目标！</p>
            </div>`;
        const area = c.querySelector('#mg-area');
        const scoreEl = c.querySelector('#mg-score');
        const timeEl = c.querySelector('#mg-time');

        const spawnTarget = () => {
            if (timeLeft <= 0) return;
            area.querySelectorAll('.reflex-target').forEach(e => e.remove());
            const t = createElement('div', 'reflex-target');
            const sz = 36 + Math.random() * 20;
            t.style.cssText = `width:${sz}px;height:${sz}px;top:${10+Math.random()*80}%;left:${5+Math.random()*85}%;position:absolute;border-radius:50%;background:var(--color-gold);cursor:pointer;transition:transform 0.1s;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 12px rgba(240,192,64,0.5);`;
            t.textContent = '⭐';
            t.addEventListener('click', () => {
                score++;
                scoreEl.textContent = score;
                t.style.transform = 'scale(0)';
                setTimeout(() => { t.remove(); spawnTarget(); }, 120);
            });
            area.appendChild(t);
            setTimeout(() => { if (t.parentElement) { t.remove(); spawnTarget(); } }, 1200);
        };

        const timer = setInterval(() => {
            timeLeft--;
            timeEl.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timer);
                this._showTrainingResult(item, score, total);
            }
        }, 1000);
        spawnTarget();
    }

    /* ========== 记忆矩阵 ========== */
    _memoryGame(item) {
        const c = this._container;
        const gridSize = 4;
        const seqLen = 5;
        const sequence = [];
        for (let i = 0; i < seqLen; i++) sequence.push(Math.floor(Math.random() * gridSize * gridSize));

        c.innerHTML = `
            <div class="minigame">
                <div class="minigame__hud">
                    <span>阶段: <strong id="mg-phase">观察</strong></span>
                    <span id="mg-info">记住亮起的顺序！</span>
                </div>
                <div class="memory-grid" id="mg-grid" style="display:grid;grid-template-columns:repeat(${gridSize},1fr);gap:8px;max-width:280px;margin:16px auto;">
                    ${Array.from({length: gridSize*gridSize}, (_, i) => `<button class="memory-cell" data-idx="${i}" style="aspect-ratio:1;border-radius:var(--radius);background:var(--color-surface);border:2px solid var(--color-surface-light);font-size:20px;cursor:pointer;transition:all 0.2s;color:var(--color-text);font-family:var(--font-main);"></button>`).join('')}
                </div>
                <p class="minigame__hint" id="mg-hint">观察亮起顺序...</p>
            </div>`;

        const cells = [...c.querySelectorAll('.memory-cell')];
        let phase = 'show', playerIdx = 0, score = 0;

        const showSeq = async () => {
            for (let i = 0; i < sequence.length; i++) {
                const cell = cells[sequence[i]];
                cell.style.background = 'var(--color-gold)';
                cell.textContent = i + 1;
                await this._sleep(600);
                cell.style.background = 'var(--color-surface)';
                cell.textContent = '';
                await this._sleep(200);
            }
            phase = 'input';
            c.querySelector('#mg-phase').textContent = '复现';
            c.querySelector('#mg-hint').textContent = '按顺序点击刚才亮起的格子！';
        };

        cells.forEach(cell => {
            cell.addEventListener('click', () => {
                if (phase !== 'input') return;
                const idx = parseInt(cell.dataset.idx);
                if (idx === sequence[playerIdx]) {
                    cell.style.background = 'var(--color-success)';
                    cell.textContent = '✓';
                    playerIdx++; score++;
                    if (playerIdx >= sequence.length) {
                        this._showTrainingResult(item, score, seqLen);
                    }
                } else {
                    cell.style.background = 'var(--color-danger)';
                    cell.textContent = '✗';
                    this._showTrainingResult(item, score, seqLen);
                }
            });
        });

        showSeq();
    }

    /* ========== 节奏打击 ========== */
    _rhythmGame(item) {
        const c = this._container;
        const total = 10;
        let score = 0, idx = 0;

        c.innerHTML = `
            <div class="minigame">
                <div class="minigame__hud">
                    <span>命中: <strong id="mg-score">0</strong> / ${total}</span>
                </div>
                <div class="rhythm-track" id="rhythm-track" style="position:relative;height:60px;background:var(--color-surface);border-radius:var(--radius);overflow:hidden;margin:16px 0;">
                    <div class="rhythm-zone" style="position:absolute;left:42%;width:16%;height:100%;background:rgba(240,192,64,0.2);border:2px solid var(--color-gold);border-radius:var(--radius);"></div>
                </div>
                <button class="btn btn--gold btn--large" id="rhythm-btn" style="width:100%;font-size:20px;padding:16px;">🎯 打击！</button>
                <p class="minigame__hint">在音符进入金色区域时按下「打击」！</p>
            </div>`;

        const track = c.querySelector('#rhythm-track');
        const btn = c.querySelector('#rhythm-btn');
        const scoreEl = c.querySelector('#mg-score');

        const spawnNote = () => {
            if (idx >= total) { this._showTrainingResult(item, score, total); return; }
            const note = createElement('div', 'rhythm-note');
            note.style.cssText = 'position:absolute;left:-30px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:50%;background:var(--color-accent);transition:none;display:flex;align-items:center;justify-content:center;font-size:14px;';
            note.textContent = '♪';
            track.appendChild(note);
            let posX = -30;
            const speed = 3 + Math.random();
            let hit = false;
            const move = () => {
                if (hit) return;
                posX += speed;
                note.style.left = posX + 'px';
                if (posX > track.clientWidth + 40) { note.remove(); idx++; setTimeout(spawnNote, 300 + Math.random() * 400); return; }
                requestAnimationFrame(move);
            };
            move();
            note._getPos = () => posX;
            note._setHit = () => { hit = true; };
        };

        btn.addEventListener('click', () => {
            const notes = track.querySelectorAll('.rhythm-note');
            const tw = track.clientWidth;
            const zoneL = tw * 0.42, zoneR = tw * 0.58;
            let bestNote = null, bestDist = Infinity;
            notes.forEach(n => {
                const px = n._getPos();
                const dist = Math.abs(px - (zoneL + zoneR) / 2);
                if (px >= zoneL - 15 && px <= zoneR + 15 && dist < bestDist) { bestDist = dist; bestNote = n; }
            });
            if (bestNote) {
                bestNote._setHit();
                bestNote.style.background = 'var(--color-success)';
                bestNote.textContent = '✓';
                score++; idx++;
                scoreEl.textContent = score;
                setTimeout(() => { bestNote.remove(); setTimeout(spawnNote, 300 + Math.random() * 400); }, 200);
            }
        });

        setTimeout(spawnNote, 500);
    }

    /* ========== 团队默契 ========== */
    _teamworkGame(item) {
        const c = this._container;
        const pairs = ['🗡️','🛡️','🏹','🔮','🎯','⚡','💎','🔥'];
        const shuffled = [...pairs, ...pairs].sort(() => Math.random() - 0.5);
        let flipped = [], matched = 0, total = pairs.length;

        c.innerHTML = `
            <div class="minigame">
                <div class="minigame__hud">
                    <span>配对: <strong id="mg-score">0</strong> / ${total}</span>
                </div>
                <div class="match-grid" id="match-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:320px;margin:16px auto;">
                    ${shuffled.map((v, i) => `<button class="match-cell" data-idx="${i}" data-val="${v}" style="aspect-ratio:1;border-radius:var(--radius);background:var(--color-surface);border:2px solid var(--color-surface-light);font-size:24px;cursor:pointer;transition:all 0.3s;color:var(--color-text);font-family:var(--font-main);">?</button>`).join('')}
                </div>
                <p class="minigame__hint">翻开两张相同的卡片完成配对！</p>
            </div>`;

        const cells = [...c.querySelectorAll('.match-cell')];
        const scoreEl = c.querySelector('#mg-score');

        cells.forEach(cell => {
            cell.addEventListener('click', () => {
                if (flipped.length >= 2 || cell.dataset.done || flipped.includes(cell)) return;
                cell.textContent = cell.dataset.val;
                cell.style.background = 'var(--color-surface-light)';
                flipped.push(cell);
                if (flipped.length === 2) {
                    const [a, b] = flipped;
                    if (a.dataset.val === b.dataset.val) {
                        a.style.background = 'var(--color-success)'; a.dataset.done = '1';
                        b.style.background = 'var(--color-success)'; b.dataset.done = '1';
                        matched++;
                        scoreEl.textContent = matched;
                        flipped = [];
                        if (matched >= total) this._showTrainingResult(item, total, total);
                    } else {
                        setTimeout(() => {
                            a.textContent = '?'; a.style.background = 'var(--color-surface)';
                            b.textContent = '?'; b.style.background = 'var(--color-surface)';
                            flipped = [];
                        }, 600);
                    }
                }
            });
        });
    }

    /* ========== 训练结算 ========== */
    _showTrainingResult(item, score, total) {
        game.state.team.gold -= item.cost;
        const pct = score / total;
        const grade = pct >= TRAINING.GRADE_S_THRESHOLD ? 'S' : pct >= TRAINING.GRADE_A_THRESHOLD ? 'A' : pct >= TRAINING.GRADE_B_THRESHOLD ? 'B' : 'C';
        const boost = grade === 'S' ? TRAINING.GRADE_S_BOOST : grade === 'A' ? TRAINING.GRADE_A_BOOST : grade === 'B' ? TRAINING.GRADE_B_BOOST : TRAINING.GRADE_C_BOOST;

        let affectedCount = 0;
        if (boost > 0) {
            const starterIds = new Set(game.state.starters || []);
            this._players.forEach(p => {
                const isTarget = TRAINING.BOOST_TARGET === 'all' || starterIds.has(p.id) || starterIds.size === 0;
                if (isTarget && p.stats[item.stat] !== undefined) {
                    p.stats[item.stat] = Math.min(TRAINING.MAX_STAT, p.stats[item.stat] + boost);
                    affectedCount++;
                }
            });
            game.state.players = this._players;
        }

        const c = this._container;
        c.innerHTML = `
            <div class="minigame minigame--result">
                <div class="mg-result">
                    <h2 class="mg-result__grade mg-result__grade--${grade.toLowerCase()}">${grade}</h2>
                    <h3>训练完成！</h3>
                    <p>得分: ${score} / ${total}</p>
                    <p>评级: <strong>${grade}</strong></p>
                    ${boost > 0 ? `<p class="mg-result__boost">首发${affectedCount}名选手「${item.stat}」 +${boost} 🎉</p>` : '<p class="mg-result__boost mg-result__boost--none">未达标，无属性提升</p>'}
                    <p class="mg-result__cost">消耗金币: ${item.cost}</p>
                    <div class="mg-result__btns">
                        <button class="btn btn--gold" id="btn-retry">再次训练</button>
                        <button class="btn btn--outline" id="btn-back">返回训练基地</button>
                    </div>
                </div>
            </div>`;
        c.querySelector('#btn-retry').addEventListener('click', () => this._startTraining(item));
        c.querySelector('#btn-back').addEventListener('click', () => this._renderMain());
        game.save();
    }

    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}
