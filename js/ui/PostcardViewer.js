import { CITIES } from '../data/cities.js';
import { game } from '../core/GameEngine.js';
import { createElement } from './Components.js';
import { sfxConfirm } from './SoundManager.js';

const STYLE_ATTR = 'data-postcard-viewer-styles';

function ensureStyles() {
    if (document.head.querySelector(`[${STYLE_ATTR}]`)) return;
    const s = document.createElement('style');
    s.setAttribute(STYLE_ATTR, '1');
    s.textContent = `
@keyframes postcard-viewer-pop {
  from { opacity: 0; transform: scale(0.92) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes postcard-viewer-shimmer {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes postcard-viewer-modal-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes postcard-viewer-modal-panel {
  from { opacity: 0; transform: scale(0.96) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.postcard-viewer * { box-sizing: border-box; }
.postcard-viewer__card {
  transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
}
.postcard-viewer__card--collected:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 14px 28px rgba(0,0,0,0.28);
}
.postcard-viewer__card--locked:hover {
  transform: translateY(-2px);
}
.postcard-viewer__tab {
  transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
}
.postcard-viewer__tab:active {
  transform: scale(0.97);
}
`;
    document.head.appendChild(s);
}

const ICON_POOL = ['🏛️', '🗼', '⛩️', '🌉', '🎡', '🏯', '🎮', '🌸', '🦁', '⛰️', '🛕', '🕌', '🏟️', '🌃', '🗺️', '🏙️', '🏔️', '🌊', '🛶', '💧'];

function landmarkIcon(landmarkId) {
    let h = 0;
    for (let i = 0; i < landmarkId.length; i++) h += landmarkId.charCodeAt(i);
    return ICON_POOL[h % ICON_POOL.length];
}

function cityList() {
    return Object.keys(CITIES).filter((name) => (CITIES[name].landmarks || []).length > 0);
}

export class PostcardViewer {
    constructor() {
        this._filterCity = null;
        this._modalBackdrop = null;
        this._container = null;
    }

    _postcardsForCity(cityName) {
        const raw = game.state.explore?.[cityName]?.postcards;
        return Array.isArray(raw) ? raw : [];
    }

    _findPostcard(cityName, landmarkId) {
        return this._postcardsForCity(cityName).find((p) => p.id === landmarkId) || null;
    }

    _isCollected(cityName, landmarkId) {
        return !!this._findPostcard(cityName, landmarkId);
    }

    _getCityProgress(cityName) {
        const city = CITIES[cityName];
        if (!city) return { collected: 0, total: 0 };
        const landmarks = city.landmarks || [];
        let collected = 0;
        for (const lm of landmarks) {
            if (this._isCollected(cityName, lm.id)) collected++;
        }
        return { collected, total: landmarks.length };
    }

    _getAllPostcards() {
        let total = 0;
        const collected = [];
        for (const cityName of Object.keys(CITIES)) {
            const city = CITIES[cityName];
            const landmarks = city.landmarks || [];
            total += landmarks.length;
            for (const lm of landmarks) {
                if (this._isCollected(cityName, lm.id)) {
                    const saved = this._findPostcard(cityName, lm.id);
                    collected.push(this._mergeSlot(cityName, city.color, lm, saved));
                }
            }
        }
        return { collected, total };
    }

    _mergeSlot(cityName, cityColor, landmark, saved) {
        const icon = (saved && saved.icon) || landmarkIcon(landmark.id);
        const desc = (saved && saved.desc) || landmark.desc || '';
        const name = (saved && saved.name) || landmark.name;
        const date = (saved && saved.date) || '';
        return {
            id: landmark.id,
            name,
            city: (saved && saved.city) || cityName,
            desc,
            date,
            icon,
            _cityColor: cityColor,
            _cityName: cityName,
        };
    }

    _completedCities() {
        const done = [];
        for (const cityName of cityList()) {
            const { collected, total } = this._getCityProgress(cityName);
            if (total > 0 && collected === total) done.push(cityName);
        }
        return done;
    }

    _closeModal() {
        if (this._modalBackdrop) {
            this._modalBackdrop.remove();
            this._modalBackdrop = null;
        }
    }

    _openModal(slot) {
        this._closeModal();
        const backdrop = createElement('div', 'postcard-viewer-modal-backdrop');
        backdrop.style.cssText = [
            'position:fixed', 'inset:0', 'z-index:9999',
            'background:rgba(0,0,0,0.55)', 'backdrop-filter:blur(6px)',
            'display:flex', 'align-items:center', 'justify-content:center', 'padding:16px',
            'animation: postcard-viewer-modal-in 0.25s ease forwards',
        ].join(';');

        const panel = createElement('div', 'postcard-viewer-modal-panel');
        const accent = slot._cityColor || 'var(--color-accent)';
        panel.style.cssText = [
            'width:100%', 'max-width:380px', 'border-radius: var(--radius-lg)',
            'background: linear-gradient(165deg, var(--color-surface-light) 0%, var(--color-surface) 45%, var(--color-bg) 100%)',
            'border: 2px solid ' + accent,
            'box-shadow: 0 24px 48px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset',
            'padding: 22px 20px 18px', 'color: var(--color-text)',
            'animation: postcard-viewer-modal-panel 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        ].join(';');

        const iconWrap = createElement('div');
        iconWrap.style.cssText = [
            'text-align:center', 'font-size:4.2rem', 'line-height:1', 'margin-bottom:12px',
            'filter: drop-shadow(0 6px 12px rgba(0,0,0,0.25))',
        ].join(';');
        iconWrap.textContent = slot.icon;

        const title = createElement('h2');
        title.style.cssText = 'margin:0 0 6px;font-size:1.35rem;font-weight:700;text-align:center;letter-spacing:0.02em;';
        title.textContent = slot.name;

        const cityLine = createElement('div');
        cityLine.style.cssText = [
            'text-align:center', 'font-size:0.95rem', 'color: var(--color-text-dim)', 'margin-bottom:14px',
            'display:flex', 'align-items:center', 'justify-content:center', 'gap:8px', 'flex-wrap:wrap',
        ].join(';');
        const badge = createElement('span');
        badge.style.cssText = [
            'display:inline-flex', 'align-items:center', 'gap:4px', 'padding:4px 10px', 'border-radius:999px',
            'font-size:0.8rem', 'font-weight:600', 'color:#fff',
            'background: linear-gradient(90deg, ' + accent + ', color-mix(in srgb, ' + accent + ' 70%, #000))',
            'box-shadow: 0 2px 8px color-mix(in srgb, ' + accent + ' 40%, transparent)',
        ].join(';');
        badge.textContent = '📍 ' + slot.city;
        cityLine.appendChild(badge);

        const descBox = createElement('div');
        descBox.style.cssText = [
            'font-size:0.92rem', 'line-height:1.55', 'color: var(--color-text)',
            'padding:14px', 'border-radius: var(--radius)', 'margin-bottom:12px',
            'background: color-mix(in srgb, var(--color-surface-light) 88%, transparent)',
            'border: 1px solid color-mix(in srgb, var(--color-text-dim) 18%, transparent)',
        ].join(';');
        descBox.textContent = slot.desc || '（暂无文案）';

        const dateRow = createElement('div');
        dateRow.style.cssText = 'text-align:center;font-size:0.85rem;color:var(--color-text-dim);margin-bottom:16px;';
        dateRow.textContent = slot.date ? '📅 收录于 ' + slot.date : '📅 收录日期待定';

        const btnRow = createElement('div');
        btnRow.style.cssText = 'display:flex;justify-content:center;';
        const closeBtn = createElement('button', 'btn');
        closeBtn.type = 'button';
        closeBtn.textContent = '✖ 关闭';
        closeBtn.style.cssText = [
            'min-width:120px', 'padding:10px 20px', 'border-radius: var(--radius)',
            'border: none', 'cursor: pointer', 'font-weight: 600', 'font-size: 0.95rem',
            'background: linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 75%, #1a1a2e))',
            'color: #fff', 'box-shadow: 0 4px 14px color-mix(in srgb, var(--color-accent) 35%, transparent)',
        ].join(';');
        closeBtn.addEventListener('click', () => {
            sfxConfirm();
            this._closeModal();
        });

        btnRow.appendChild(closeBtn);
        panel.appendChild(iconWrap);
        panel.appendChild(title);
        panel.appendChild(cityLine);
        panel.appendChild(descBox);
        panel.appendChild(dateRow);
        panel.appendChild(btnRow);
        backdrop.appendChild(panel);

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                sfxConfirm();
                this._closeModal();
            }
        });

        this._modalBackdrop = backdrop;
        document.body.appendChild(backdrop);
    }

    _buildBadgeRow(completedNames) {
        const row = createElement('div');
        if (!completedNames.length) {
            row.style.display = 'none';
            return row;
        }
        row.style.cssText = [
            'display:flex', 'flex-wrap:wrap', 'gap:10px', 'align-items:center', 'margin-bottom:14px',
            'padding:12px 14px', 'border-radius: var(--radius-lg)',
            'background: linear-gradient(105deg, color-mix(in srgb, var(--color-gold) 22%, transparent), color-mix(in srgb, var(--color-success) 12%, transparent))',
            'border: 1px solid color-mix(in srgb, var(--color-gold) 35%, transparent)',
        ].join(';');

        const label = createElement('span');
        label.style.cssText = 'font-size:0.82rem;font-weight:700;color:var(--color-text);margin-right:4px;';
        label.textContent = '🏆 城市满贯';
        row.appendChild(label);

        for (const name of completedNames) {
            const city = CITIES[name];
            const c = city?.color || 'var(--color-accent)';
            const chip = createElement('span');
            chip.style.cssText = [
                'display:inline-flex', 'align-items:center', 'gap:4px', 'padding:6px 12px', 'border-radius:999px',
                'font-size:0.78rem', 'font-weight:700', 'color:#fff',
                'background: linear-gradient(120deg, ' + c + ', color-mix(in srgb, ' + c + ' 65%, #111))',
                'box-shadow: 0 2px 10px rgba(0,0,0,0.2)', 'animation: postcard-viewer-pop 0.4s ease both',
            ].join(';');
            chip.textContent = name + ' ✨';
            row.appendChild(chip);
        }
        return row;
    }

    _buildHeader() {
        const bar = createElement('header');
        bar.style.cssText = [
            'display:grid', 'grid-template-columns: minmax(88px,auto) 1fr minmax(88px,auto)', 'align-items:center',
            'margin-bottom:18px', 'padding:14px 16px', 'border-radius: var(--radius-lg)',
            'background: linear-gradient(120deg, var(--color-surface) 0%, var(--color-surface-light) 50%, var(--color-surface) 100%)',
            'border: 1px solid color-mix(in srgb, var(--color-text-dim) 15%, transparent)',
            'box-shadow: 0 8px 24px rgba(0,0,0,0.12)',
        ].join(';');

        const back = createElement('button', 'btn');
        back.type = 'button';
        back.textContent = '← 返回';
        back.style.cssText = [
            'padding:8px 14px', 'border-radius: var(--radius)', 'border: 1px solid color-mix(in srgb, var(--color-text-dim) 25%, transparent)',
            'background: var(--color-bg)', 'color: var(--color-text)', 'cursor: pointer', 'font-weight: 600', 'font-size: 0.9rem', 'justify-self:start',
        ].join(';');
        back.addEventListener('click', () => {
            sfxConfirm();
            game.sceneManager.switchTo('home');
        });

        const title = createElement('h1');
        title.style.cssText = 'margin:0;font-size:1.15rem;font-weight:800;letter-spacing:0.04em;color:var(--color-text);text-align:center;';
        title.textContent = '🗂️ 文旅图鉴';

        const balance = createElement('div');
        balance.style.width = '1px';
        balance.style.justifySelf = 'end';

        bar.appendChild(back);
        bar.appendChild(title);
        bar.appendChild(balance);
        return bar;
    }

    _buildStats(allCollected, totalPossible, completedCount) {
        const wrap = createElement('div');
        wrap.style.cssText = [
            'display:grid', 'grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))', 'gap:12px', 'margin-bottom:16px',
        ].join(';');

        const card1 = createElement('div');
        card1.style.cssText = [
            'padding:14px 16px', 'border-radius: var(--radius-lg)',
            'background: linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 18%, var(--color-surface)), var(--color-surface))',
            'border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
        ].join(';');
        card1.innerHTML = '<div style="font-size:0.75rem;color:var(--color-text-dim);margin-bottom:6px;">📮 明信片进度</div>'
            + '<div style="font-size:1.35rem;font-weight:800;color:var(--color-text);">'
            + allCollected + '<span style="font-weight:500;color:var(--color-text-dim);font-size:0.95rem;"> / ' + totalPossible + '</span></div>';

        const card2 = createElement('div');
        card2.style.cssText = [
            'padding:14px 16px', 'border-radius: var(--radius-lg)',
            'background: linear-gradient(135deg, color-mix(in srgb, var(--color-success) 16%, var(--color-surface)), var(--color-surface))',
            'border: 1px solid color-mix(in srgb, var(--color-success) 28%, transparent)',
        ].join(';');
        card2.innerHTML = '<div style="font-size:0.75rem;color:var(--color-text-dim);margin-bottom:6px;">🌆 城市全收集</div>'
            + '<div style="font-size:1.35rem;font-weight:800;color:var(--color-text);">' + completedCount + '<span style="font-weight:500;color:var(--color-text-dim);font-size:0.95rem;"> 座</span></div>';

        wrap.appendChild(card1);
        wrap.appendChild(card2);
        return wrap;
    }

    _buildTabs() {
        const wrap = createElement('div');
        wrap.style.cssText = [
            'display:flex', 'flex-wrap:wrap', 'gap:8px', 'margin-bottom:16px', 'overflow-x:auto', 'padding-bottom:4px',
        ].join(';');

        const makeTab = (label, cityKey) => {
            const active = (cityKey === null && this._filterCity === null) || cityKey === this._filterCity;
            const btn = createElement('button', 'postcard-viewer__tab');
            btn.type = 'button';
            btn.textContent = label;
            btn.style.cssText = [
                'padding:8px 14px', 'border-radius:999px', 'border: 1px solid',
                active
                    ? 'color:#fff;border-color:transparent;background:linear-gradient(135deg,var(--color-accent),color-mix(in srgb,var(--color-accent) 70%,#1e1e2e));box-shadow:0 4px 12px color-mix(in srgb,var(--color-accent) 35%,transparent);'
                    : 'color:var(--color-text-dim);border-color:color-mix(in srgb,var(--color-text-dim) 22%,transparent);background:var(--color-bg);',
                'cursor:pointer', 'font-weight:600', 'font-size:0.82rem', 'white-space:nowrap',
            ].join(' ');
            btn.addEventListener('click', () => {
                sfxConfirm();
                this._filterCity = cityKey;
                this.render(this._container);
            });
            return btn;
        };

        wrap.appendChild(makeTab('🌏 全部', null));
        for (const name of cityList()) {
            wrap.appendChild(makeTab(CITIES[name].name || name, name));
        }
        return wrap;
    }

    _slotsForGrid() {
        const slots = [];
        const cities = this._filterCity ? [this._filterCity] : cityList();
        for (const cityName of cities) {
            const city = CITIES[cityName];
            if (!city) continue;
            for (const lm of city.landmarks || []) {
                const collected = this._isCollected(cityName, lm.id);
                const saved = this._findPostcard(cityName, lm.id);
                const merged = this._mergeSlot(cityName, city.color, lm, saved);
                slots.push({ ...merged, _collected: collected });
            }
        }
        return slots;
    }

    _buildGrid(slots) {
        const grid = createElement('div', 'postcard-viewer__grid');
        grid.style.cssText = [
            'display:grid',
            'grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))',
            'gap:14px',
        ].join(';');

        slots.forEach((slot, idx) => {
            const card = createElement('div', 'postcard-viewer__card postcard-viewer__card--' + (slot._collected ? 'collected' : 'locked'));
            card.style.cssText = [
                'border-radius: var(--radius-lg)', 'min-height: 168px', 'padding: 12px 10px',
                'display:flex', 'flex-direction:column', 'align-items:center', 'text-align:center',
                'cursor:' + (slot._collected ? 'pointer' : 'default'),
                'animation: postcard-viewer-pop 0.45s ease ' + (idx * 0.03) + 's both',
            ].join(';');

            const accent = slot._cityColor || 'var(--color-accent)';
            if (slot._collected) {
                card.style.border = '2px solid ' + accent;
                card.style.background = [
                    'linear-gradient(145deg,',
                    'color-mix(in srgb, ' + accent + ' 35%, var(--color-surface)) 0%,',
                    'var(--color-surface) 38%,',
                    'color-mix(in srgb, var(--color-surface-light) 90%, ' + accent + ') 100%)',
                ].join(' ');
                card.style.boxShadow = '0 6px 18px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.12)';
                card.style.backgroundSize = '200% 200%';
                card.style.animation = 'postcard-viewer-pop 0.45s ease ' + (idx * 0.03) + 's both, postcard-viewer-shimmer 8s ease-in-out infinite alternate';
            } else {
                card.style.border = '2px dashed color-mix(in srgb, var(--color-text-dim) 35%, transparent)';
                card.style.background = 'linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg) 100%)';
                card.style.filter = 'grayscale(1)';
                card.style.opacity = '0.88';
            }

            const iconEl = createElement('div');
            iconEl.style.cssText = 'font-size:2.4rem;line-height:1;margin-bottom:8px;font-weight:800;';
            iconEl.textContent = slot._collected ? slot.icon : '?';

            const nameEl = createElement('div');
            nameEl.style.cssText = [
                'font-size:0.88rem', 'font-weight:700', 'line-height:1.25', 'margin-bottom:4px', 'width:100%',
                slot._collected ? 'color:var(--color-text)' : 'color:var(--color-text-dim);opacity:0.65',
            ].join(';');
            nameEl.textContent = slot.name;

            const cityEl = createElement('div');
            cityEl.style.cssText = 'font-size:0.72rem;color:var(--color-text-dim);margin-bottom:6px;width:100%;';
            cityEl.textContent = slot._collected ? ('🌆 ' + slot.city) : '🔒 未收录';

            const dateEl = createElement('div');
            dateEl.style.cssText = 'font-size:0.68rem;color:var(--color-text-dim);margin-top:auto;';
            dateEl.textContent = slot._collected && slot.date ? ('📅 ' + slot.date) : (slot._collected ? '📅 —' : '');

            card.appendChild(iconEl);
            card.appendChild(nameEl);
            card.appendChild(cityEl);
            card.appendChild(dateEl);

            if (slot._collected) {
                card.addEventListener('click', () => {
                    sfxConfirm();
                    this._openModal(slot);
                });
            }

            grid.appendChild(card);
        });

        return grid;
    }

    render(container) {
        ensureStyles();
        this._container = container;
        container.innerHTML = '';

        const root = createElement('div', 'postcard-viewer');
        root.style.cssText = [
            'min-height:100%', 'padding:16px 14px 28px',
            'background: radial-gradient(ellipse 120% 80% at 50% -20%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 55%), var(--color-bg)',
            'color: var(--color-text)',
        ].join(';');

        const { collected: collectedList, total: totalPossible } = this._getAllPostcards();
        const completedCities = this._completedCities();

        root.appendChild(this._buildHeader());
        root.appendChild(this._buildBadgeRow(completedCities));
        root.appendChild(this._buildStats(collectedList.length, totalPossible, completedCities.length));
        root.appendChild(this._buildTabs());

        const emptyHint = createElement('div');
        emptyHint.style.cssText = 'text-align:center;padding:24px;color:var(--color-text-dim);font-size:0.9rem;display:none;';

        const slots = this._slotsForGrid();
        const grid = this._buildGrid(slots);
        if (!slots.length) {
            emptyHint.style.display = 'block';
            emptyHint.textContent = '🧭 暂无地标数据';
        }

        root.appendChild(grid);
        root.appendChild(emptyHint);
        container.appendChild(root);
    }
}
