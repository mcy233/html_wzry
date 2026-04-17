/**
 * RecruitScene - 签约大厅（全屏Banner + 悬浮UI）
 * 参考英雄联盟电竞经理风格：切换池子 = 切换底图，文字浮在图上
 */
import { game } from '../core/GameEngine.js';
import { createElement, showToast } from '../ui/Components.js';
import { singlePull, tenPull, getGoldPity, getTickets, getWishList, setWishList } from '../systems/RecruitSystem.js';
import { RECRUIT } from '../data/balance.js';
import { sfxClick, sfxConfirm, sfxCardReveal } from '../ui/SoundManager.js';

const RARITY_COLOR = { R: '#4ea8de', SR: '#a855f7', SSR: '#f0c040' };
const RARITY_GLOW  = { R: '0 0 20px rgba(78,168,222,0.4)', SR: '0 0 25px rgba(168,85,247,0.5)', SSR: '0 0 35px rgba(240,192,64,0.6)' };

const POOLS = {
    default: {
        label: '2027 KPL',
        sub: '春季签约池',
        tag: '常驻',
        tagColor: '#4ea8de',
        banner: 'resources/ui/recruit/banner-default.webp',
        fallbackGrad: 'radial-gradient(ellipse at 50% 40%, #1a2a5c 0%, #0a0e17 70%)',
    },
    limited: {
        label: '至臻归来',
        sub: '限定签约池',
        tag: '限时',
        tagColor: '#a855f7',
        banner: 'resources/ui/recruit/banner-limited.webp',
        fallbackGrad: 'radial-gradient(ellipse at 50% 40%, #3a1a4c 0%, #0a0e17 70%)',
    },
};

export class RecruitScene {
    async enter(container) {
        this._container = container;
        container.className = 'scene scene--recruit';
        this._pool = 'default';
        this._render();
    }
    exit() { this._container = null; }

    _render() {
        const tickets = getTickets();
        const pity = getGoldPity();
        const pool = POOLS[this._pool];
        const c = this._container;

        c.innerHTML = `
        <!-- 全屏Banner底图 -->
        <div class="rcr-backdrop" style="background-image: url('${pool.banner}'), ${pool.fallbackGrad}"></div>
        <div class="rcr-backdrop__overlay"></div>

        <div class="rcr-layout">
            <!-- 顶栏 -->
            <header class="rcr-topbar">
                <div class="rcr-topbar__left">
                    <button class="btn btn--back" id="btn-back">← 签约选手</button>
                </div>
                <div class="rcr-topbar__res">
                    <span class="rcr-res"><span class="rcr-res__icon">🎫</span> 金券 <strong>${tickets.gold || 0}</strong></span>
                    <span class="rcr-res"><span class="rcr-res__icon">🎫</span> 蓝券 <strong>${tickets.blue || 0}</strong></span>
                    <span class="rcr-res">保底 <strong>${pity}/${RECRUIT.GOLD_PITY}</strong></span>
                </div>
            </header>

            <!-- 左侧池子切换 -->
            <nav class="rcr-sidebar">
                ${Object.entries(POOLS).map(([key, p]) => `
                    <button class="rcr-pool ${this._pool === key ? 'rcr-pool--active' : ''}" data-pool="${key}">
                        <span class="rcr-pool__tag" style="--tag-color:${p.tagColor}">${p.tag}</span>
                        <span class="rcr-pool__name">${p.label}</span>
                    </button>
                `).join('')}
                <button class="rcr-pool rcr-pool--wish" id="btn-wish">
                    ❤️ 心愿单
                </button>
            </nav>

            <!-- 中央文字信息（悬浮在底图上） -->
            <div class="rcr-center">
                <div class="rcr-hero-text">
                    <h2 class="rcr-hero-text__title">${pool.label}</h2>
                    <p class="rcr-hero-text__sub">${pool.sub}</p>
                    <p class="rcr-hero-text__rates">SSR ${(RECRUIT.SSR_RATE * 100).toFixed(1)}% · SR ${(RECRUIT.SR_RATE * 100).toFixed(1)}% · R ${((1 - RECRUIT.SSR_RATE - RECRUIT.SR_RATE) * 100).toFixed(1)}%</p>
                    <p class="rcr-hero-text__pity">10连必得SR以上 · ${RECRUIT.GOLD_PITY}抽必得SSR <strong>${pity}/${RECRUIT.GOLD_PITY}</strong></p>
                </div>
            </div>

            <!-- 右下角保底计数 -->
            <div class="rcr-pity-badge">
                <span>${RECRUIT.GOLD_PITY}抽必得SSR</span>
                <strong>${pity}/${RECRUIT.GOLD_PITY}</strong>
            </div>

            <!-- 底部抽卡按钮 -->
            <div class="rcr-actions">
                <button class="rcr-btn rcr-btn--single" id="btn-single-gold" ${(tickets.gold || 0) >= 1 ? '' : 'disabled'}>
                    <span class="rcr-btn__label">单签</span>
                    <span class="rcr-btn__icon">🎫</span>
                    <span class="rcr-btn__cost">×1</span>
                </button>
                <button class="rcr-btn rcr-btn--ten" id="btn-ten-gold" ${(tickets.gold || 0) >= 10 ? '' : 'disabled'}>
                    <span class="rcr-btn__label">十连</span>
                    <span class="rcr-btn__icon">🎫</span>
                    <span class="rcr-btn__cost">×10</span>
                </button>
            </div>

            <!-- 抽卡结果覆盖层 -->
            <div class="rcr-results" id="rcr-results"></div>
        </div>`;

        this._bindEvents();
    }

    _bindEvents() {
        const c = this._container;
        c.querySelector('#btn-back')?.addEventListener('click', () => {
            sfxClick(); game.sceneManager.switchTo('home');
        });
        c.querySelectorAll('.rcr-pool[data-pool]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.pool === this._pool) return;
                sfxClick();
                this._pool = btn.dataset.pool;
                this._switchPool();
            });
        });
        c.querySelector('#btn-single-gold')?.addEventListener('click', () => this._doPull('gold', 1));
        c.querySelector('#btn-ten-gold')?.addEventListener('click', () => this._doPull('gold', 10));
        c.querySelector('#btn-wish')?.addEventListener('click', () => this._showWishModal());
    }

    _switchPool() {
        const pool = POOLS[this._pool];
        const backdrop = this._container.querySelector('.rcr-backdrop');
        if (backdrop) {
            backdrop.style.backgroundImage = `url('${pool.banner}'), ${pool.fallbackGrad}`;
            backdrop.classList.remove('rcr-backdrop--switching');
            void backdrop.offsetWidth;
            backdrop.classList.add('rcr-backdrop--switching');
            backdrop.addEventListener('animationend', () => {
                backdrop.classList.remove('rcr-backdrop--switching');
            }, { once: true });
        }
        this._updatePoolUI(pool);
    }

    _updatePoolUI(pool) {
        const c = this._container;
        const tickets = getTickets();
        const pity = getGoldPity();

        c.querySelectorAll('.rcr-pool[data-pool]').forEach(btn => {
            btn.classList.toggle('rcr-pool--active', btn.dataset.pool === this._pool);
        });

        const title = c.querySelector('.rcr-hero-text__title');
        const sub = c.querySelector('.rcr-hero-text__sub');
        if (title) title.textContent = pool.label;
        if (sub) sub.textContent = pool.sub;

        const singleBtn = c.querySelector('#btn-single-gold');
        const tenBtn = c.querySelector('#btn-ten-gold');
        if (singleBtn) singleBtn.disabled = (tickets.gold || 0) < 1;
        if (tenBtn) tenBtn.disabled = (tickets.gold || 0) < 10;
    }

    async _doPull(type, count) {
        sfxConfirm();
        const results = count === 1 ? singlePull(type) : tenPull(type);
        if (!results) { showToast('券不够！'); return; }
        game.silentSave();
        await this._showPullAnimation(results);
    }

    async _showPullAnimation(results) {
        const area = this._container.querySelector('#rcr-results');
        if (!area) return;

        const hasSSR = results.some(r => r.rarity === 'SSR');

        area.innerHTML = `
        <div class="rcr-anim">
            ${hasSSR ? '<div class="rcr-anim__flash"></div>' : ''}
            <div class="rcr-anim__cards" id="rcr-cards"></div>
            <button class="rcr-anim__close" id="btn-close-results">点击关闭</button>
        </div>`;

        area.querySelector('#btn-close-results')?.addEventListener('click', () => {
            area.innerHTML = '';
            this._render();
        });

        const cardsEl = area.querySelector('#rcr-cards');
        const rc = r => (r || 'r').toLowerCase();

        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            const rarity = r.rarity || 'R';
            const color = RARITY_COLOR[rarity] || '#aaa';
            const glow = RARITY_GLOW[rarity] || 'none';
            const backImg = `resources/ui/recruit/card-back-${rc(rarity)}.webp`;
            const frameImg = `resources/ui/recruit/card-frame-${rc(rarity)}.webp`;

            const card = createElement('div', 'rcr-card');
            card.innerHTML = `
                <div class="rcr-card__inner" style="--rarity-color:${color}">
                    <div class="rcr-card__back">
                        <img src="${backImg}" alt="card back" />
                    </div>
                    <div class="rcr-card__front">
                        <img class="rcr-card__frame-img" src="${frameImg}" alt="frame" />
                        <div class="rcr-card__content">
                            <div class="rcr-card__name">${r.player.id || r.player.name}</div>
                            <div class="rcr-card__role">${r.player.role}</div>
                            <div class="rcr-card__rating">⭐ ${r.player.rating}</div>
                            ${r.isDupe
                                ? `<div class="rcr-card__dupe">重复 → +${r.fragments}碎片</div>`
                                : '<div class="rcr-card__new">NEW!</div>'}
                        </div>
                    </div>
                </div>`;
            card.style.setProperty('--card-glow', glow);
            cardsEl.appendChild(card);

            await this._sleep(200);
            sfxCardReveal();
            card.classList.add('rcr-card--revealed');
        }
    }

    _showWishModal() {
        sfxClick();
        const modal = createElement('div', 'rcr-modal');
        modal.innerHTML = `
            <div class="rcr-modal__backdrop"></div>
            <div class="rcr-modal__content glass-panel">
                <h3>❤️ 设置心愿单</h3>
                <p>最多3位 · 抽到SSR时有${(RECRUIT.WISH_SSR_RATE * 100).toFixed(0)}%概率为心愿选手</p>
                <input id="wish-input" placeholder="输入选手ID，逗号分隔" value="${getWishList().join(', ')}"
                    class="rcr-modal__input">
                <div class="rcr-modal__btns">
                    <button class="btn btn--gold btn--small" id="btn-wish-save">保存</button>
                    <button class="btn btn--outline btn--small" id="btn-wish-cancel">取消</button>
                </div>
            </div>`;
        this._container.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('rcr-modal--show'));

        modal.querySelector('#btn-wish-save').addEventListener('click', () => {
            const val = modal.querySelector('#wish-input').value;
            const ids = val.split(/[,，]/).map(s => s.trim()).filter(Boolean).slice(0, 3);
            setWishList(ids);
            game.save();
            modal.remove();
            showToast('心愿单已更新');
        });
        modal.querySelector('#btn-wish-cancel').addEventListener('click', () => modal.remove());
        modal.querySelector('.rcr-modal__backdrop').addEventListener('click', () => modal.remove());
    }

    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}
