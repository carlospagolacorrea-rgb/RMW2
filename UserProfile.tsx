import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { getUserStats, UserPlay } from './services/supabaseClient';

export const UserProfile: React.FC<{ user: User, onBack: () => void, onLogout: () => void }> = ({ user, onBack, onLogout }) => {
    const [stats, setStats] = useState<{ total: number, recent: UserPlay[], totalScore: number, rank: string, streak: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUserStats(user.id).then(data => {
            setStats(data);
            setLoading(false);
        });
    }, [user.id]);

    return (
        <div className="flex flex-col items-center gap-8 py-6 animate-drop w-full max-w-4xl">
            <div className="text-center space-y-3">
                <h2 className="font-['Bebas_Neue'] text-5xl tracking-widest uppercase text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">MI PERFIL</h2>
                <p className="crt-text text-[10px] opacity-60 uppercase tracking-widest mt-2">
                    ESTADÍSTICAS DEL AGENTE: {user.user_metadata.username || 'DESCONOCIDO'}
                </p>
                {stats && (
                    <>
                        <div className="flex flex-col items-center gap-1 mt-4">
                            <span className="font-['Bebas_Neue'] text-2xl md:text-3xl tracking-wider text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                                {stats.rank}
                            </span>
                            <span className="crt-text text-[9px] opacity-40 uppercase tracking-widest">
                                RANGO ACTUAL
                            </span>
                        </div>

                        {stats.streak > 0 && (
                            <div className="flex items-center gap-2 mt-3 px-4 py-2 border border-amber-500/30 bg-amber-500/5">
                                <span className="text-2xl">🔥</span>
                                <div className="flex flex-col">
                                    <span className="font-['Bebas_Neue'] text-xl text-amber-500">
                                        {stats.streak} {stats.streak === 1 ? 'DÍA' : 'DÍAS'}
                                    </span>
                                    <span className="crt-text text-[8px] opacity-50 uppercase tracking-wider">
                                        RACHA ACTIVA
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {loading ? (
                <div className="p-20 text-center crt-text text-amber-500 animate-pulse uppercase">Cargando datos del perfil...</div>
            ) : (
                <div className="w-full flex flex-col gap-8">
                    {/* Stats Card */}
                    <div className="w-full border-2 border-amber-500/50 bg-black/80 p-8 flex flex-col items-center justify-center relative shadow-[0_0_20px_rgba(255,188,71,0.1)]">
                        <div className="absolute top-0 left-0 w-2 h-2 bg-amber-500"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 bg-amber-500"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 bg-amber-500"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-amber-500"></div>

                        <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center justify-center w-full">
                            <div className="flex flex-col items-center">
                                <span className="text-6xl md:text-8xl font-black text-amber-500 drop-shadow-[0_0_15px_rgba(255,188,71,0.4)] font-['Bebas_Neue']">
                                    {stats?.total || 0}
                                </span>
                                <span className="crt-text text-sm md:text-base tracking-[0.3em] uppercase opacity-80 mt-2">
                                    PALABRAS JUGADAS
                                </span>
                            </div>

                            <div className="hidden md:block w-[2px] h-24 bg-amber-500/30"></div>

                            <div className="flex flex-col items-center">
                                <span className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] font-['Bebas_Neue']">
                                    {stats?.totalScore.toFixed(1) || '0.0'}
                                </span>
                                <span className="crt-text text-sm md:text-base tracking-[0.3em] uppercase opacity-80 mt-2">
                                    PUNTUACIÓN TOTAL
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Recent History Table */}
                    <div className="w-full border-2 border-amber-500/30 bg-black/60 overflow-hidden flex flex-col">
                        <div className="bg-amber-500/10 p-3 border-b border-amber-500/30">
                            <h3 className="crt-text text-xs font-bold uppercase tracking-widest text-center text-amber-500">
                                ÚLTIMAS 20 ASOCIACIONES
                            </h3>
                        </div>

                        <div className="overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-amber-500">
                            {stats?.recent.length === 0 ? (
                                <div className="p-10 text-center crt-text text-amber-500/50 uppercase">No hay actividad reciente.</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-black z-10 border-b border-amber-500/20">
                                        <tr className="crt-text text-[10px] opacity-60 text-amber-500 uppercase">
                                            <th className="p-4 font-normal">FECHA</th>
                                            <th className="p-4 font-normal">JUGADA</th>
                                            <th className="p-4 font-normal text-right">PTS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats?.recent.map((play, i) => (
                                            <tr key={i} className="border-b border-amber-500/5 hover:bg-amber-500/5 transition-colors">
                                                <td className="p-4 font-['Bebas_Neue'] text-sm opacity-50">
                                                    {new Date(play.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 font-['Courier_Prime'] text-xs">
                                                        <span className="opacity-60 uppercase">{play.prompt}</span>
                                                        <span className="text-amber-500 hidden md:inline">→</span>
                                                        <span className="text-white uppercase font-bold tracking-wider">
                                                            {play.response}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-bold text-amber-500/90 font-['Bebas_Neue'] text-lg">
                                                    {play.score.toFixed(1)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full flex flex-col md:flex-row gap-4 max-w-lg">
                <button onClick={onBack} className="retro-button px-8 py-4 w-full md:flex-1 uppercase">VOLVER</button>
                <button onClick={() => { onLogout(); onBack(); }} className="retro-button px-8 py-4 w-full md:flex-1 uppercase">CERRAR SESIÓN</button>
            </div>
        </div>
    );
};
