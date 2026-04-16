/**
 * Tutorial - 新手引导系统
 * 分步骤引导玩家了解游戏核心玩法
 */
import { createElement } from './Components.js';

const TUTORIAL_STEPS = [
    {
        title: '欢迎来到 KPL传奇之路！',
        content: '你将成为一支KPL战队的教练，带领队伍从春季赛一路征战到年度总决赛！',
        icon: '🏆',
        highlight: null,
    },
    {
        title: '1. 选择战队',
        content: '点击地图上的城市光点选择一支战队。每支战队有不同的属性、城市Buff和特殊机制。选择你最喜爱或最擅长的！',
        icon: '🗺️',
        highlight: null,
    },
    {
        title: '2. 战队基地',
        content: '选队后进入基地界面，这里可以：开始比赛、训练选手、探索城市、管理阵容、查看赛程。',
        icon: '🏠',
        highlight: null,
    },
    {
        title: '3. 比赛系统',
        content: '比赛分为5个回合：\n① 对线期 — 分配关注度\n② 野区博弈 — 选择行动路线\n③ 中期团战 — QTE时机 + 策略对抗\n④ 宏观策略 — 卡牌对抗\n⑤ 终局决战 — 快速抉择',
        icon: '⚔️',
        highlight: null,
    },
    {
        title: '4. 策略克制（核心）',
        content: '回合3和回合4都有「策略对抗」机制。三个策略形成循环克制关系（类似石头剪刀布）。\n\n💡 克制方通吃全部收益！\n⚖️ 无克制关系则获平均收益。\n\n选择前仔细看克制图！',
        icon: '📐',
        highlight: null,
    },
    {
        title: '5. 训练 & 探索',
        content: '🏋️ 训练基地：完成小游戏提升选手属性\n🏙️ 城市探索：打卡地标获得Buff，收集美食获得加成\n👥 阵容管理：调整首发/替补阵容',
        icon: '🎯',
        highlight: null,
    },
    {
        title: '6. 赛季进程',
        content: '每赛季包含春季赛、夏季赛、季后赛和年度总决赛。比赛胜利获得积分，排名前列才能晋级季后赛！\n\n📋 赛程总览中查看排名和进度。',
        icon: '📋',
        highlight: null,
    },
    {
        title: '准备好了吗？',
        content: '现在就去选择你的战队，开启你的KPL传奇之路吧！\n\n💡 小提示：随时可以在设置中重新查看本引导。',
        icon: '🚀',
        highlight: null,
    },
];

export class Tutorial {
    constructor() {
        this._currentStep = 0;
        this._overlay = null;
        this._onComplete = null;
    }

    show(onComplete) {
        this._onComplete = onComplete;
        this._currentStep = 0;
        this._createOverlay();
        this._renderStep();
    }

    _createOverlay() {
        this._overlay = createElement('div', 'tutorial-overlay');
        document.body.appendChild(this._overlay);
    }

    _renderStep() {
        const step = TUTORIAL_STEPS[this._currentStep];
        const isFirst = this._currentStep === 0;
        const isLast = this._currentStep === TUTORIAL_STEPS.length - 1;
        const progress = ((this._currentStep + 1) / TUTORIAL_STEPS.length * 100).toFixed(0);

        this._overlay.innerHTML = `
            <div class="tutorial-card">
                <div class="tutorial-progress">
                    <div class="tutorial-progress__fill" style="width:${progress}%"></div>
                </div>
                <div class="tutorial-step">
                    <div class="tutorial-step__icon">${step.icon}</div>
                    <h3 class="tutorial-step__title">${step.title}</h3>
                    <div class="tutorial-step__content">${step.content.replace(/\n/g, '<br>')}</div>
                </div>
                <div class="tutorial-nav">
                    ${isFirst
                        ? '<button class="btn btn--outline tutorial-skip" id="tut-skip">跳过引导</button>'
                        : '<button class="btn btn--outline" id="tut-prev">← 上一步</button>'}
                    <span class="tutorial-counter">${this._currentStep + 1} / ${TUTORIAL_STEPS.length}</span>
                    ${isLast
                        ? '<button class="btn btn--gold" id="tut-finish">开始游戏！</button>'
                        : '<button class="btn btn--gold" id="tut-next">下一步 →</button>'}
                </div>
            </div>`;

        this._overlay.querySelector('#tut-next')?.addEventListener('click', () => { this._currentStep++; this._renderStep(); });
        this._overlay.querySelector('#tut-prev')?.addEventListener('click', () => { this._currentStep--; this._renderStep(); });
        this._overlay.querySelector('#tut-skip')?.addEventListener('click', () => this._finish());
        this._overlay.querySelector('#tut-finish')?.addEventListener('click', () => this._finish());
    }

    _finish() {
        this._overlay?.remove();
        this._overlay = null;
        localStorage.setItem('kpl_tutorial_done', '1');
        this._onComplete?.();
    }

    static shouldShow() {
        return !localStorage.getItem('kpl_tutorial_done');
    }

    static reset() {
        localStorage.removeItem('kpl_tutorial_done');
    }
}
