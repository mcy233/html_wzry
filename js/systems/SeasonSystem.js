/**
 * SeasonSystem - 赛季管理系统
 * 
 * 模拟KPL真实赛制：
 * - S/A/B三个分组（各6支队伍）
 * - 组内循环赛（Bo5计胜负）
 * - 赛季分阶段推进：常规赛(3轮) → 季后赛 → 总决赛
 * - 所有战队同步模拟比赛
 * - 升降级机制
 */
import { TEAMS } from '../data/teams.js';

export const GROUP_NAMES = { S: 'S组', A: 'A组', B: 'B组' };
export const GROUP_SIZE = 6;

/* 赛季阶段定义 */
export const PHASES = [
    { id: 'spring_regular', name: '春季赛 · 常规赛', rounds: 5, type: 'regular' },
    { id: 'spring_playoff', name: '春季赛 · 季后赛', rounds: 3, type: 'playoff' },
    { id: 'summer_regular', name: '夏季赛 · 常规赛', rounds: 5, type: 'regular' },
    { id: 'summer_playoff', name: '夏季赛 · 季后赛', rounds: 3, type: 'playoff' },
    { id: 'annual_finals',  name: '年度总决赛',       rounds: 3, type: 'finals' },
];

export class SeasonSystem {
    constructor(playerTeamId) {
        this.playerTeamId = playerTeamId;
        this.teams = TEAMS.map(t => t.id);
        this.groups = { S: [], A: [], B: [] };
        this.standings = {};
        this.schedule = [];
        this.matchLog = [];
        this.currentPhaseIdx = 0;
        this.currentRound = 0;
    }

    /**
     * 从已有存档恢复
     */
    static fromSaveData(data) {
        const sys = new SeasonSystem(data.playerTeamId);
        sys.groups = data.groups;
        sys.standings = data.standings;
        sys.schedule = data.schedule || [];
        sys.matchLog = data.matchLog || [];
        sys.currentPhaseIdx = data.currentPhaseIdx || 0;
        sys.currentRound = data.currentRound || 0;
        return sys;
    }

    toSaveData() {
        return {
            playerTeamId: this.playerTeamId,
            groups: this.groups,
            standings: this.standings,
            schedule: this.schedule,
            matchLog: this.matchLog,
            currentPhaseIdx: this.currentPhaseIdx,
            currentRound: this.currentRound,
        };
    }

    get currentPhase() {
        return PHASES[this.currentPhaseIdx] || PHASES[PHASES.length - 1];
    }

    get isSeasonOver() {
        return this.currentPhaseIdx >= PHASES.length;
    }

    getTeamGroup(teamId) {
        for (const [g, ids] of Object.entries(this.groups)) {
            if (ids.includes(teamId)) return g;
        }
        return null;
    }

    /**
     * 初始化分组 —— 按战队综合实力排序后分入S/A/B
     */
    initGroups() {
        const ranked = [...TEAMS]
            .map(t => {
                const avgRating = t.players.reduce((s, p) => s + p.rating, 0) / t.players.length;
                return { id: t.id, rating: avgRating };
            })
            .sort((a, b) => b.rating - a.rating);

        this.groups.S = ranked.slice(0, GROUP_SIZE).map(t => t.id);
        this.groups.A = ranked.slice(GROUP_SIZE, GROUP_SIZE * 2).map(t => t.id);
        this.groups.B = ranked.slice(GROUP_SIZE * 2).map(t => t.id);

        this.standings = {};
        this.teams.forEach(id => {
            this.standings[id] = { wins: 0, losses: 0, points: 0, diff: 0, streak: 0 };
        });

        this.schedule = [];
        this.matchLog = [];
        this.currentPhaseIdx = 0;
        this.currentRound = 0;

        this._generateSchedule();
    }

    /**
     * 生成当前阶段的赛程
     */
    _generateSchedule() {
        this.schedule = [];
        const phase = this.currentPhase;
        if (!phase) return;

        if (phase.type === 'regular') {
            for (const [groupName, teamIds] of Object.entries(this.groups)) {
                for (let i = 0; i < teamIds.length; i++) {
                    for (let j = i + 1; j < teamIds.length; j++) {
                        this.schedule.push({
                            homeTeam: teamIds[i],
                            awayTeam: teamIds[j],
                            group: groupName,
                            phase: phase.id,
                            round: -1,
                            played: false,
                            result: null,
                        });
                    }
                }
            }
            this._shuffleArray(this.schedule);
            const matchesPerRound = Math.ceil(this.schedule.length / phase.rounds);
            this.schedule.forEach((m, i) => {
                m.round = Math.floor(i / matchesPerRound);
            });
        } else if (phase.type === 'playoff') {
            this._generatePlayoffSchedule(phase);
        } else if (phase.type === 'finals') {
            this._generateFinalsSchedule(phase);
        }
    }

    _generatePlayoffSchedule(phase) {
        const topTeams = this._getTopTeamsByGroup(4);
        const allTop = [...topTeams.S, ...topTeams.A];
        for (let round = 0; round < phase.rounds; round++) {
            for (let i = 0; i < allTop.length; i += 2) {
                if (allTop[i + 1]) {
                    this.schedule.push({
                        homeTeam: allTop[i],
                        awayTeam: allTop[i + 1],
                        group: 'playoff',
                        phase: phase.id,
                        round,
                        played: false,
                        result: null,
                    });
                }
            }
        }
    }

    _generateFinalsSchedule(phase) {
        const topTeams = this._getTopTeamsByGroup(2);
        const finalists = [...topTeams.S, ...topTeams.A.slice(0, 2)];
        for (let round = 0; round < phase.rounds; round++) {
            for (let i = 0; i < finalists.length; i += 2) {
                if (finalists[i + 1]) {
                    this.schedule.push({
                        homeTeam: finalists[i],
                        awayTeam: finalists[i + 1],
                        group: 'finals',
                        phase: phase.id,
                        round,
                        played: false,
                        result: null,
                    });
                }
            }
        }
    }

    _getTopTeamsByGroup(n) {
        const result = {};
        for (const [g, ids] of Object.entries(this.groups)) {
            const sorted = [...ids].sort((a, b) => {
                const sa = this.standings[a] || { points: 0, diff: 0 };
                const sb = this.standings[b] || { points: 0, diff: 0 };
                return (sb.points - sa.points) || (sb.diff - sa.diff);
            });
            result[g] = sorted.slice(0, n);
        }
        return result;
    }

    /**
     * 获取当前轮次中玩家的对手（含回退到同阶段 round 最小的未打比赛）
     */
    getPlayerMatch() {
        const phase = this.currentPhase;
        const exact = this.schedule.find(
            m => !m.played && m.round === this.currentRound && m.phase === phase?.id &&
                (m.homeTeam === this.playerTeamId || m.awayTeam === this.playerTeamId)
        );
        if (exact) return exact;
        // 回退：同阶段中 round 最小的未打玩家比赛
        const candidates = this.schedule.filter(
            m => !m.played && m.phase === phase?.id &&
                (m.homeTeam === this.playerTeamId || m.awayTeam === this.playerTeamId)
        );
        if (candidates.length === 0) return null;
        candidates.sort((a, b) => a.round - b.round);
        return candidates[0];
    }

    /**
     * 获取当前轮次中所有未打的比赛
     */
    getCurrentRoundMatches() {
        return this.schedule.filter(m => m.round === this.currentRound && m.phase === this.currentPhase.id);
    }

    /**
     * 记录玩家比赛结果
     */
    recordPlayerMatch(matchIdx, won, killsMy, killsEnemy) {
        const match = typeof matchIdx === 'number' ? this.schedule[matchIdx] : matchIdx;
        if (!match) return;

        const isHome = match.homeTeam === this.playerTeamId;
        match.played = true;
        match.result = {
            winner: won ? this.playerTeamId : (isHome ? match.awayTeam : match.homeTeam),
            score: won ? [3, Math.floor(Math.random() * 2)] : [Math.floor(Math.random() * 2), 3],
            killsHome: isHome ? killsMy : killsEnemy,
            killsAway: isHome ? killsEnemy : killsMy,
        };

        this._updateStandings(match);
        this.matchLog.push({ ...match, timestamp: Date.now() });
    }

    /**
     * 模拟同一轮次中其他队伍的比赛
     * @param {number} [round] 指定轮次，默认 currentRound
     */
    simulateOtherMatches(round) {
        const r = round ?? this.currentRound;
        const results = [];
        const roundMatches = this.schedule.filter(
            m => !m.played && m.round === r && m.phase === this.currentPhase.id
        );

        for (const match of roundMatches) {
            if (match.homeTeam === this.playerTeamId || match.awayTeam === this.playerTeamId) continue;

            const home = TEAMS.find(t => t.id === match.homeTeam);
            const away = TEAMS.find(t => t.id === match.awayTeam);
            if (!home || !away) continue;

            const homeStr = this._teamStrength(home);
            const awayStr = this._teamStrength(away);
            const homeWinProb = homeStr / (homeStr + awayStr) + 0.05; // slight home advantage
            const homeWin = Math.random() < homeWinProb;

            const killBase = 8 + Math.floor(Math.random() * 10);
            match.played = true;
            match.result = {
                winner: homeWin ? match.homeTeam : match.awayTeam,
                score: homeWin ? [3, Math.floor(Math.random() * 3)] : [Math.floor(Math.random() * 3), 3],
                killsHome: homeWin ? killBase + Math.floor(Math.random() * 5) : killBase - Math.floor(Math.random() * 3),
                killsAway: homeWin ? killBase - Math.floor(Math.random() * 3) : killBase + Math.floor(Math.random() * 5),
            };

            this._updateStandings(match);
            this.matchLog.push({ ...match, timestamp: Date.now() });
            results.push(match);
        }
        return results;
    }

    /**
     * 推进到下一轮
     * 自动模拟没有玩家比赛的中间轮次，确保 currentRound 始终停在有玩家比赛的轮次
     */
    advanceRound() {
        const phase = this.currentPhase;
        if (!phase) return 'season_over';

        for (let safety = 0; safety < 50; safety++) {
            const unplayed = this.schedule.filter(m => !m.played && m.phase === phase.id);
            if (unplayed.length === 0) {
                return this.advancePhase();
            }

            const nextRound = Math.min(...unplayed.map(m => m.round));
            this.currentRound = nextRound;

            const hasPlayerMatch = unplayed.some(
                m => m.round === nextRound &&
                    (m.homeTeam === this.playerTeamId || m.awayTeam === this.playerTeamId)
            );

            if (hasPlayerMatch) return 'next_round';

            this.simulateOtherMatches(nextRound);
        }
        return 'next_round';
    }

    /**
     * 推进到下一阶段（含升降级处理）
     */
    advancePhase() {
        const phase = this.currentPhase;
        if (phase && phase.type === 'regular') {
            this._handlePromoRelegation();
        }

        this.currentPhaseIdx++;
        this.currentRound = 0;

        if (this.currentPhaseIdx >= PHASES.length) {
            return 'season_over';
        }

        Object.values(this.standings).forEach(s => {
            s.wins = 0; s.losses = 0; s.points = 0; s.diff = 0; s.streak = 0;
        });

        this._generateSchedule();
        return 'next_phase';
    }

    /**
     * 升降级：每组底部2名降级，顶部2名升级
     */
    _handlePromoRelegation() {
        const getGroupRanking = (groupIds) => {
            return [...groupIds].sort((a, b) => {
                const sa = this.standings[a] || { points: 0, diff: 0 };
                const sb = this.standings[b] || { points: 0, diff: 0 };
                return (sb.points - sa.points) || (sb.diff - sa.diff);
            });
        };

        const sRank = getGroupRanking(this.groups.S);
        const aRank = getGroupRanking(this.groups.A);
        const bRank = getGroupRanking(this.groups.B);

        const sDown = sRank.slice(-2);
        const aUp = aRank.slice(0, 2);
        const aDown = aRank.slice(-2);
        const bUp = bRank.slice(0, 2);

        this.groups.S = [...sRank.slice(0, -2), ...aUp];
        this.groups.A = [...aRank.slice(2, -2), ...sDown, ...bUp];
        this.groups.B = [...bRank.slice(2), ...aDown];
    }

    /**
     * 获取某个组的排名表
     */
    getGroupStandings(groupName) {
        const ids = this.groups[groupName] || [];
        return ids.map(id => {
            const team = TEAMS.find(t => t.id === id);
            const st = this.standings[id] || { wins: 0, losses: 0, points: 0, diff: 0, streak: 0 };
            return { id, team, ...st };
        }).sort((a, b) => (b.points - a.points) || (b.diff - a.diff) || (b.wins - a.wins));
    }

    /**
     * 获取全部赛事日志（可按组筛选）
     */
    getMatchLog(group = null) {
        if (!group) return this.matchLog;
        return this.matchLog.filter(m => m.group === group);
    }

    /**
     * 获取玩家战队的比赛历史
     */
    getPlayerHistory() {
        return this.matchLog.filter(m =>
            m.homeTeam === this.playerTeamId || m.awayTeam === this.playerTeamId
        );
    }

    /* --- 内部工具 --- */
    _teamStrength(team) {
        const players = team.players || [];
        const avg = players.reduce((s, p) => s + p.rating, 0) / (players.length || 1);
        return avg + (Math.random() - 0.5) * 15;
    }

    _updateStandings(match) {
        const { homeTeam, awayTeam, result } = match;
        if (!result) return;
        const winnerId = result.winner;
        const loserId = winnerId === homeTeam ? awayTeam : homeTeam;
        const killDiff = (result.killsHome || 0) - (result.killsAway || 0);

        if (!this.standings[winnerId]) this.standings[winnerId] = { wins: 0, losses: 0, points: 0, diff: 0, streak: 0 };
        if (!this.standings[loserId]) this.standings[loserId] = { wins: 0, losses: 0, points: 0, diff: 0, streak: 0 };

        this.standings[winnerId].wins++;
        this.standings[winnerId].points += 3;
        this.standings[winnerId].diff += (winnerId === homeTeam ? killDiff : -killDiff);
        this.standings[winnerId].streak = Math.max(1, (this.standings[winnerId].streak || 0) + 1);

        this.standings[loserId].losses++;
        this.standings[loserId].diff += (loserId === homeTeam ? killDiff : -killDiff);
        this.standings[loserId].streak = Math.min(-1, (this.standings[loserId].streak || 0) - 1);
    }

    _shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}
