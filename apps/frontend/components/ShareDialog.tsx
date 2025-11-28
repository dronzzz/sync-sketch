"use client";

import { useState } from "react";
import { Share2, Loader2 } from "lucide-react";

interface ShareDialogProps {
    onConfirm: () => Promise<void>;
    onClose: () => void;
}

export const ShareDialog = ({ onConfirm, onClose }: ShareDialogProps) => {
    const [isCreating, setIsCreating] = useState(false);

    const handleConfirm = async () => {
        setIsCreating(true);
        await onConfirm();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-800"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Share this canvas?
                    </h3>
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        Create a live room so others can join and draw with you.
                    </p>
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={isCreating}
                    className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-4 font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-70"
                >
                    {isCreating ? (
                        <>
                            <Loader2 className="size-5 animate-spin" />
                            Creating room...
                        </>
                    ) : (
                        <>
                            <Share2 className="size-5" />
                            Start Session
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};