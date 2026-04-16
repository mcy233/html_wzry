/**
 * TitleScene - 游戏标题画面
 */
import { game } from '../core/GameEngine.js';
import { createElement, createButton } from '../ui/Components.js';
import { staggerIn } from '../ui/Transitions.js';
import { Tutorial } from '../ui/Tutorial.js';

export class TitleScene {
    async enter(container) {
        container.className = 'scene scene--title';
        container.innerHTML = `
            <div class="title-bg">
                <div class="title-particles" id="particles"></div>
            </div>
            <div class="title-content">
                <div class="title-logo">
                    <div class="title-logo__sub">— KPL 2027 —</div>
                    <h1 class="title-logo__main">城市荣耀</h1>
                    <div class="title-logo__tagline">KPL传奇之路</div>
                </div>
                <div class="title-menu" id="title-menu"></div>
            </div>
            <div class="title-footer">基于王者荣耀电竞IP · 由腾讯AI工具辅助开发</div>
        `;

        const menu = container.querySelector('#title-menu');

        if (game.hasSave()) {
            menu.appendChild(createButton('继续游戏', () => this._continueGame(), 'btn btn--primary btn--large'));
        }
        menu.appendChild(createButton('新的赛季', () => this._newGame(), 'btn btn--gold btn--large'));
        menu.appendChild(createButton('新手引导', () => this._showTutorial(), 'btn btn--outline btn--large'));
        menu.appendChild(createButton('游戏设置', () => this._openSettings(), 'btn btn--outline btn--large'));
        menu.appendChild(createButton('游戏说明', () => this._showHelp(container), 'btn btn--outline btn--large'));

        const buttons = menu.querySelectorAll('.btn');
        await staggerIn([...buttons], 120);

        this._startParticles(container.querySelector('#particles'));
    }

    exit() {
        if (this._particleTimer) cancelAnimationFrame(this._particleTimer);
    }

    _continueGame() {
        game.sceneManager.switchTo('home');
    }

    _newGame() {
        game.newGame();
        if (Tutorial.shouldShow()) {
            const tut = new Tutorial();
            tut.show(() => game.sceneManager.switchTo('teamSelect'));
        } else {
            game.sceneManager.switchTo('teamSelect');
        }
    }

    _showTutorial() {
        const tut = new Tutorial();
        tut.show(() => {});
    }

    _openSettings() {
        game.sceneManager.switchTo('settings');
    }

    _showHelp(container) {
        const overlay = createElement('div', 'modal-overlay');
        overlay.innerHTML = `
            <div class="modal">
                <h2 class="modal__title">游戏说明</h2>
                <div class="modal__body">
                    <p><strong>「城市荣耀 · KPL传奇之路」</strong></p>
                    <p>选择一支KPL战队，代表你的城市出征。从春季赛一路征战到年度总决赛，用你的战术智慧带领战队登上巅峰！</p>
                    <ul>
                        <li>🏙️ <strong>18座城市 × 18支战队</strong>，各具特色</li>
                        <li>⚔️ <strong>策略对战</strong>：Ban/Pick + 5回合战术博弈</li>
                        <li>🗺️ <strong>城市探索</strong>：打卡地标、收集美食、感受文化</li>
                        <li>📖 <strong>剧情体验</strong>：每支战队独特的成长故事</li>
                    </ul>
                    <p>时间线设定在2027年——一个尚未发生的赛季，结局由你书写！</p>
                </div>
                <button class="btn btn--primary modal__close">开始冒险</button>
            </div>
        `;
        overlay.querySelector('.modal__close').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        container.appendChild(overlay);
    }

    _startParticles(el) {
        if (!el) return;
        const create = () => {
            if (!el.isConnected) return;
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (3 + Math.random() * 4) + 's';
            p.style.opacity = (0.3 + Math.random() * 0.5);
            p.style.width = p.style.height = (2 + Math.random() * 4) + 'px';
            el.appendChild(p);
            setTimeout(() => p.remove(), 7000);
        };
        const loop = () => {
            create();
            this._particleTimer = setTimeout(() => requestAnimationFrame(loop), 200 + Math.random() * 300);
        };
        loop();
    }
}
