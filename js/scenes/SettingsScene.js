/**
 * SettingsScene - 游戏设置界面
 * AI教练模型配置、音效调节、游戏偏好
 */
import { game } from '../core/GameEngine.js';
import { createElement, createButton } from '../ui/Components.js';
import { getCoachConfig, saveCoachConfig } from '../systems/AICoach.js';
import { setVolume, setEnabled, isEnabled, sfxClick, sfxConfirm } from '../ui/SoundManager.js';

const SETTINGS_KEY = 'kpl_game_settings';

function loadSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
    catch { return {}; }
}
function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

const PRESET_MODELS = [
    { label: 'DeepSeek', url: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
    { label: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
    { label: 'Moonshot (Kimi)', url: 'https://api.moonshot.cn/v1/chat/completions', model: 'moonshot-v1-8k' },
    { label: 'GLM (智谱)', url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-4-flash' },
    { label: '自定义', url: '', model: '' },
];

export class SettingsScene {
    async enter(container) {
        container.className = 'scene scene--settings';

        const coachCfg = getCoachConfig();
        const gameCfg = loadSettings();
        const soundEnabled = isEnabled();
        const bgmVol = gameCfg.bgmVolume ?? 30;
        const sfxVol = gameCfg.sfxVolume ?? 50;

        container.innerHTML = `
        <div class="settings-page">
            <div class="settings-header">
                <button class="btn btn--back" id="btn-back">← 返回基地</button>
                <h1 class="settings-title">⚙️ 游戏设置</h1>
                <div></div>
            </div>

            <div class="settings-body">
                <!-- AI教练模型配置 -->
                <section class="settings-section">
                    <h2 class="settings-section__title">🤖 AI教练 · 大模型配置</h2>
                    <p class="settings-section__desc">
                        接入大语言模型后，AI教练将在BP阶段和比赛卡牌阶段提供更智能、更个性化的策略建议。
                        未配置时使用内置规则引擎。
                    </p>

                    <div class="settings-field">
                        <label class="settings-label">预设模型</label>
                        <div class="settings-presets" id="presets">
                            ${PRESET_MODELS.map((p, i) => `
                                <button class="preset-btn ${_matchPreset(coachCfg, p) ? 'preset-btn--active' : ''}" data-idx="${i}">
                                    ${p.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="settings-field">
                        <label class="settings-label" for="inp-api-url">API 地址</label>
                        <input class="settings-input" id="inp-api-url" type="url"
                               placeholder="https://api.deepseek.com/v1 或完整地址"
                               value="${coachCfg.apiUrlRaw || coachCfg.apiUrl || ''}">
                    </div>

                    <div class="settings-field">
                        <label class="settings-label" for="inp-api-key">API Key</label>
                        <div class="settings-input-wrap">
                            <input class="settings-input" id="inp-api-key" type="password"
                                   placeholder="sk-xxxxxxxx"
                                   value="${coachCfg.apiKey || ''}">
                            <button class="btn-eye" id="btn-toggle-key" title="显示/隐藏">👁</button>
                        </div>
                    </div>

                    <div class="settings-field">
                        <label class="settings-label" for="inp-model">模型名称</label>
                        <div class="settings-model-wrap">
                            <input class="settings-input" id="inp-model" type="text"
                                   placeholder="deepseek-chat"
                                   value="${coachCfg.model || ''}"
                                   autocomplete="off">
                            <button class="btn btn--outline settings-model-search" id="btn-search-models" title="搜索可用模型">🔍 搜索模型</button>
                        </div>
                        <div class="settings-model-dropdown" id="model-dropdown" style="display:none"></div>
                    </div>

                    <div class="settings-actions">
                        <button class="btn btn--outline" id="btn-test-api">🔌 测试连接</button>
                        <span class="test-result" id="test-result"></span>
                    </div>

                    <div class="settings-field">
                        <label class="settings-label">启用场景</label>
                        <div class="settings-checkboxes">
                            <label class="settings-checkbox">
                                <input type="checkbox" id="chk-bp" ${coachCfg.enableBP !== false ? 'checked' : ''}>
                                <span>BP阶段</span>
                            </label>
                            <label class="settings-checkbox">
                                <input type="checkbox" id="chk-battle" ${coachCfg.enableBattle !== false ? 'checked' : ''}>
                                <span>卡牌对战阶段</span>
                            </label>
                        </div>
                    </div>
                </section>

                <!-- 音效设置 -->
                <section class="settings-section">
                    <h2 class="settings-section__title">🔊 音效设置</h2>

                    <div class="settings-field">
                        <label class="settings-checkbox">
                            <input type="checkbox" id="chk-sound" ${soundEnabled ? 'checked' : ''}>
                            <span>开启音效</span>
                        </label>
                    </div>

                    <div class="settings-field">
                        <label class="settings-label">🎵 背景音乐</label>
                        <div class="settings-slider-wrap">
                            <input type="range" class="settings-slider" id="sld-bgm"
                                   min="0" max="100" value="${bgmVol}" ${!soundEnabled ? 'disabled' : ''}>
                            <span class="settings-slider-val" id="val-bgm">${bgmVol}%</span>
                        </div>
                    </div>

                    <div class="settings-field">
                        <label class="settings-label">💥 游戏音效</label>
                        <div class="settings-slider-wrap">
                            <input type="range" class="settings-slider" id="sld-sfx"
                                   min="0" max="100" value="${sfxVol}" ${!soundEnabled ? 'disabled' : ''}>
                            <span class="settings-slider-val" id="val-sfx">${sfxVol}%</span>
                        </div>
                    </div>
                </section>

                <!-- 保存按钮 -->
                <div class="settings-save-bar">
                    <button class="btn btn--gold btn--large" id="btn-save">💾 保存设置</button>
                </div>
            </div>
        </div>`;

        this._bind(container);
    }

    exit() {}

    _bind(container) {
        container.querySelector('#btn-back').addEventListener('click', () => {
            sfxClick();
            game.sceneManager.switchTo('home');
        });

        // 预设按钮
        container.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                sfxClick();
                const idx = +btn.dataset.idx;
                const preset = PRESET_MODELS[idx];
                container.querySelector('#inp-api-url').value = preset.url;
                container.querySelector('#inp-model').value = preset.model;
                container.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('preset-btn--active'));
                btn.classList.add('preset-btn--active');
            });
        });

        // 显示/隐藏 API Key
        container.querySelector('#btn-toggle-key').addEventListener('click', () => {
            const inp = container.querySelector('#inp-api-key');
            inp.type = inp.type === 'password' ? 'text' : 'password';
        });

        // 音量滑条实时反馈
        const sldBgm = container.querySelector('#sld-bgm');
        const sldSfx = container.querySelector('#sld-sfx');
        const valBgm = container.querySelector('#val-bgm');
        const valSfx = container.querySelector('#val-sfx');
        const chkSound = container.querySelector('#chk-sound');

        sldBgm.addEventListener('input', () => {
            valBgm.textContent = sldBgm.value + '%';
            setVolume('bgm', sldBgm.value / 100);
        });
        sldSfx.addEventListener('input', () => {
            valSfx.textContent = sldSfx.value + '%';
            setVolume('sfx', sldSfx.value / 100);
        });
        chkSound.addEventListener('change', () => {
            setEnabled(chkSound.checked);
            sldBgm.disabled = !chkSound.checked;
            sldSfx.disabled = !chkSound.checked;
        });

        // 搜索模型
        container.querySelector('#btn-search-models').addEventListener('click', () => this._fetchModels(container));

        // 点击其他位置关闭下拉
        container.addEventListener('click', (e) => {
            const dropdown = container.querySelector('#model-dropdown');
            if (!e.target.closest('.settings-model-wrap') && !e.target.closest('#model-dropdown')) {
                dropdown.style.display = 'none';
            }
        });

        // 测试连接
        container.querySelector('#btn-test-api').addEventListener('click', () => this._testApi(container));

        // 保存
        container.querySelector('#btn-save').addEventListener('click', () => {
            sfxConfirm();
            this._saveAll(container);
        });
    }

    async _fetchModels(container) {
        const dropdown = container.querySelector('#model-dropdown');
        const url = container.querySelector('#inp-api-url').value.trim();
        const key = container.querySelector('#inp-api-key').value.trim();

        if (!url || !key) {
            dropdown.style.display = 'block';
            dropdown.innerHTML = '<div class="model-dropdown__msg model-dropdown__msg--err">请先填写 API 地址和 API Key</div>';
            return;
        }

        dropdown.style.display = 'block';
        dropdown.innerHTML = '<div class="model-dropdown__msg model-dropdown__msg--loading">⏳ 正在搜索可用模型...</div>';

        const modelsUrl = this._deriveModelsUrl(url);

        try {
            const resp = await fetch(modelsUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${key}` },
            });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();

            let models = [];
            if (Array.isArray(data.data)) {
                models = data.data.map(m => ({ id: m.id, owned: m.owned_by || '' }));
            } else if (Array.isArray(data)) {
                models = data.map(m => typeof m === 'string' ? { id: m, owned: '' } : { id: m.id || m.name, owned: m.owned_by || '' });
            }

            models.sort((a, b) => a.id.localeCompare(b.id));

            if (!models.length) {
                dropdown.innerHTML = '<div class="model-dropdown__msg model-dropdown__msg--err">未找到可用模型</div>';
                return;
            }

            const chatModels = models.filter(m => /chat|gpt|claude|deepseek|glm|qwen|moonshot|gemini|llama|mistral/i.test(m.id));
            const otherModels = models.filter(m => !chatModels.includes(m));

            let html = `<div class="model-dropdown__header">找到 ${models.length} 个模型${chatModels.length ? `（${chatModels.length} 个对话模型）` : ''}</div>`;
            html += '<div class="model-dropdown__list">';

            if (chatModels.length) {
                html += '<div class="model-dropdown__group">💬 对话模型</div>';
                html += chatModels.map(m => `
                    <div class="model-dropdown__item model-dropdown__item--chat" data-model="${m.id}" title="${m.owned}">
                        <span class="model-dropdown__name">${m.id}</span>
                        ${m.owned ? `<span class="model-dropdown__owner">${m.owned}</span>` : ''}
                    </div>
                `).join('');
            }
            if (otherModels.length) {
                html += '<div class="model-dropdown__group">📦 其他模型</div>';
                html += otherModels.map(m => `
                    <div class="model-dropdown__item" data-model="${m.id}" title="${m.owned}">
                        <span class="model-dropdown__name">${m.id}</span>
                        ${m.owned ? `<span class="model-dropdown__owner">${m.owned}</span>` : ''}
                    </div>
                `).join('');
            }

            html += '</div>';
            dropdown.innerHTML = html;

            dropdown.querySelectorAll('.model-dropdown__item').forEach(item => {
                item.addEventListener('click', () => {
                    sfxClick();
                    container.querySelector('#inp-model').value = item.dataset.model;
                    dropdown.style.display = 'none';
                });
            });
        } catch (e) {
            dropdown.innerHTML = `<div class="model-dropdown__msg model-dropdown__msg--err">❌ 搜索失败: ${e.message}</div>`;
        }
    }

    /**
     * 从用户输入的 URL 推导出各端点地址。
     * 支持输入格式：
     *   - https://api.xxx.com/v1
     *   - https://api.xxx.com/v1/chat/completions
     *   - https://api.xxx.com/v1/  (带尾斜杠)
     */
    _normalizeBaseUrl(rawUrl) {
        let url = rawUrl.replace(/\/+$/, '');
        url = url.replace(/\/chat\/completions$/, '');
        return url;
    }

    _deriveChatUrl(rawUrl) {
        return this._normalizeBaseUrl(rawUrl) + '/chat/completions';
    }

    _deriveModelsUrl(rawUrl) {
        return this._normalizeBaseUrl(rawUrl) + '/models';
    }

    async _testApi(container) {
        const resultEl = container.querySelector('#test-result');
        const rawUrl = container.querySelector('#inp-api-url').value.trim();
        const key = container.querySelector('#inp-api-key').value.trim();
        const model = container.querySelector('#inp-model').value.trim();

        if (!rawUrl || !key) {
            resultEl.textContent = '❌ 请填写 API 地址和 Key';
            resultEl.className = 'test-result test-result--fail';
            return;
        }

        const chatUrl = this._deriveChatUrl(rawUrl);
        resultEl.textContent = `⏳ 测试中... → ${chatUrl}`;
        resultEl.className = 'test-result test-result--loading';

        try {
            const resp = await fetch(chatUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`,
                },
                body: JSON.stringify({
                    model: model || 'deepseek-chat',
                    messages: [{ role: 'user', content: '你好，请用一句话回复确认连接成功。' }],
                    max_tokens: 50,
                }),
            });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            const reply = data.choices?.[0]?.message?.content || '连接成功';
            resultEl.textContent = `✅ ${reply.slice(0, 80)}`;
            resultEl.className = 'test-result test-result--ok';
        } catch (e) {
            resultEl.textContent = `❌ 连接失败: ${e.message}`;
            resultEl.className = 'test-result test-result--fail';
        }
    }

    _saveAll(container) {
        const rawUrl = container.querySelector('#inp-api-url').value.trim();
        const coachCfg = {
            apiUrl: rawUrl ? this._deriveChatUrl(rawUrl) : '',
            apiUrlRaw: rawUrl,
            apiKey: container.querySelector('#inp-api-key').value.trim(),
            model: container.querySelector('#inp-model').value.trim(),
            enableBP: container.querySelector('#chk-bp').checked,
            enableBattle: container.querySelector('#chk-battle').checked,
        };
        saveCoachConfig(coachCfg);

        const gameCfg = {
            bgmVolume: +container.querySelector('#sld-bgm').value,
            sfxVolume: +container.querySelector('#sld-sfx').value,
            soundEnabled: container.querySelector('#chk-sound').checked,
        };
        saveSettings(gameCfg);

        setEnabled(gameCfg.soundEnabled);
        setVolume('bgm', gameCfg.bgmVolume / 100);
        setVolume('sfx', gameCfg.sfxVolume / 100);

        const toast = document.createElement('div');
        toast.className = 'settings-toast';
        toast.textContent = '✅ 设置已保存';
        container.querySelector('.settings-page').appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
}

function _matchPreset(cfg, preset) {
    if (!cfg.apiUrl) return false;
    return cfg.apiUrl === preset.url;
}
