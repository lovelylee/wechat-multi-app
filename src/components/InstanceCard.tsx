import { Play, Trash2, Smartphone, Power, Edit2 } from 'lucide-react';
import clsx from 'clsx';

interface Instance {
    name: string;
    path: string;
    isOriginal: boolean;
    version?: string;
}

interface Props {
    instance: Instance;
    isRunning?: boolean;
    onLaunch: (path: string) => void;
    onStop?: (path: string) => void;
    onRename?: (instance: Instance) => void;
    // onDelete is optional because we can't delete the original
    onDelete?: (path: string) => void;
}

export function InstanceCard({ instance, isRunning, onLaunch, onStop, onRename, onDelete }: Props) {
    return (
        <div className="relative group overflow-hidden rounded-2xl bg-white/5 p-6 backdrop-blur-md border border-white/10 transition-all hover:bg-white/10 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={clsx(
                        "p-3 rounded-xl",
                        instance.isOriginal ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
                    )}>
                        <Smartphone size={24} />
                    </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 pl-2">
                    {instance.version && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10 whitespace-nowrap shrink-0">
                            v{instance.version}
                        </span>
                    )}
                    {instance.isOriginal && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 whitespace-nowrap shrink-0">
                            官方原版
                        </span>
                    )}
                    {isRunning && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse whitespace-nowrap shrink-0">
                            运行中
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{instance.name}</h3>
                    {!instance.isOriginal && onRename && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isRunning) onRename(instance);
                            }}
                            disabled={isRunning}
                            className={clsx(
                                "p-1 rounded-md transition-colors",
                                isRunning
                                    ? "text-zinc-600 cursor-not-allowed"
                                    : "text-zinc-500 hover:text-white hover:bg-white/10"
                            )}
                            title={isRunning ? "运行中无法重命名" : "重命名"}
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                </div>
            </div>
            <p className="text-zinc-400 text-xs truncate mb-6" title={instance.path}>
                {instance.path}
            </p>

            <div className="flex gap-2">
                {isRunning ? (
                    <button
                        onClick={() => onStop?.(instance.path)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg font-medium transition-colors cursor-pointer group-active:scale-95 border border-red-500/20"
                    >
                        <Power size={16} />
                        停止
                    </button>
                ) : (
                    <button
                        onClick={() => onLaunch(instance.path)}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-medium transition-colors cursor-pointer group-active:scale-95"
                    >
                        <Play size={16} fill="currentColor" />
                        启动
                    </button>
                )}
                {onDelete && !instance.isOriginal && (
                    <button
                        onClick={() => onDelete(instance.path)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
                        title="删除分身"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>
        </div>
    );
}
