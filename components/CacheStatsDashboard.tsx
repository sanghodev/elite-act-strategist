import React, { useEffect, useState } from 'react';
import { Database, TrendingDown, Zap, Calendar } from 'lucide-react';
import { getDrillCacheStats } from '../services/drillCacheService';

interface CacheStatsProps {
    userId: string;
}

export const CacheStatsDashboard: React.FC<CacheStatsProps> = ({ userId }) => {
    const [stats, setStats] = useState({
        totalCached: 0,
        cachedToday: 0,
        oldestDate: null as string | null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [userId]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await getDrillCacheStats(userId);
            setStats(data);
        } catch (error) {
            console.error('Failed to load cache stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate API call savings
    const apiCallsSaved = stats.totalCached > 0 ? stats.totalCached - 1 : 0;
    const savingsPercentage = stats.totalCached > 0
        ? ((apiCallsSaved / stats.totalCached) * 100).toFixed(1)
        : '0';

    if (loading) {
        return (
            <div className="glass rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-white/10 rounded w-full"></div>
                    <div className="h-4 bg-white/10 rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <Database className="text-green-400" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold">Drill Cache Statistics</h3>
                    <p className="text-xs text-gray-500 font-mono">Performance Optimization</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Cached */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Database size={16} className="text-blue-400" />
                        <span className="text-xs font-mono text-gray-500 uppercase">Total Cached</span>
                    </div>
                    <div className="text-3xl font-black text-blue-400">
                        {stats.totalCached}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">drills stored</p>
                </div>

                {/* Today's Cache */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={16} className="text-yellow-400" />
                        <span className="text-xs font-mono text-gray-500 uppercase">Today</span>
                    </div>
                    <div className="text-3xl font-black text-yellow-400">
                        {stats.cachedToday}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">instant loads</p>
                </div>

                {/* API Savings */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={16} className="text-green-400" />
                        <span className="text-xs font-mono text-gray-500 uppercase">API Saved</span>
                    </div>
                    <div className="text-3xl font-black text-green-400">
                        {savingsPercentage}%
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{apiCallsSaved} calls saved</p>
                </div>
            </div>

            {/* Cache Age */}
            {stats.oldestDate && (
                <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={14} />
                        <span>Oldest cached drill: {stats.oldestDate}</span>
                    </div>
                </div>
            )}

            {/* Performance Indicator */}
            <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Zap className="text-green-400" size={16} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-green-400">Cache Optimization Active</p>
                        <p className="text-xs text-gray-500">
                            {stats.cachedToday > 0
                                ? `${stats.cachedToday} drills loaded instantly today without API calls`
                                : 'Start practicing to build your cache'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
