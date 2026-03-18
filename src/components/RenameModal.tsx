import { useState, useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';
import clsx from 'clsx';

interface Props {
    isOpen: boolean;
    currentName: string;
    onClose: () => void;
    onRename: (newName: string) => Promise<void>;
}

export function RenameModal({ isOpen, currentName, onClose, onRename }: Props) {
    const [name, setName] = useState(currentName);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setName(currentName);
    }, [currentName, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name === currentName || !name.trim()) {
            onClose();
            return;
        }

        setLoading(true);
        try {
            await onRename(name);
            onClose();
        } catch (err) {
            console.error(err);
            alert('重命名失败，请重试');
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

            <div className="relative w-full max-w-sm bg-[#1e1e1e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">重命名分身</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400">新名称</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                <Edit2 size={16} />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                placeholder="输入新名称"
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-zinc-300 hover:bg-white/5 transition-colors font-medium"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className={clsx(
                                "flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium shadow-lg shadow-blue-500/20 transition-all",
                                (loading || !name.trim()) ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-500 hover:scale-[1.02]"
                            )}
                        >
                            {loading ? '保存中...' : '保存'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
