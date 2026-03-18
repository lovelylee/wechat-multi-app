import { useState } from 'react';
import { X, Copy, Hash } from 'lucide-react';
import clsx from 'clsx';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, count: number) => Promise<void>;
}

export function CreateModal({ isOpen, onClose, onCreate }: Props) {
    const [name, setName] = useState('微信分身');
    const [count, setCount] = useState(1);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onCreate(name, count);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-[#1e1e1e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">创建分身</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400">分身名称</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                <Copy size={16} />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all input-shiny"
                                placeholder="例如：工作微信"
                                required
                            />
                        </div>
                        <p className="text-xs text-zinc-500">如果创建多个，将自动命名为：{name} 1, {name} 2...</p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400">创建数量</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                <Hash size={16} />
                            </div>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={count}
                                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all font-mono"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-zinc-300 hover:bg-white/5 transition-colors font-medium"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={clsx(
                                "flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white font-medium shadow-lg shadow-green-500/20 transition-all",
                                loading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-500 hover:scale-[1.02]"
                            )}
                        >
                            {loading ? '创建中...' : `创建 ${count} 个分身`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
