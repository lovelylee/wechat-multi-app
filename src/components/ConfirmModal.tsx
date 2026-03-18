import { X, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

interface Props {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = '确定',
    cancelText = '取消',
    isDestructive = false,
    onClose,
    onConfirm
}: Props) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div className={clsx(
            "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={clsx(
                "relative w-full max-w-sm bg-[#1e1e1e]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transform transition-all duration-300",
                isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
            )}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4 text-white">
                        <div className={clsx("p-3 rounded-full", isDestructive ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500")}>
                            <AlertTriangle size={24} />
                        </div>
                        <h2 className="text-xl font-semibold">{title}</h2>
                    </div>

                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-colors font-medium"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={clsx(
                                "flex-1 px-4 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all hover:scale-[1.02]",
                                isDestructive
                                    ? "bg-red-600 hover:bg-red-500 shadow-red-500/20"
                                    : "bg-green-600 hover:bg-green-500 shadow-green-500/20"
                            )}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
