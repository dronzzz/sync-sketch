"use client";

import { useState, useEffect } from "react";
import { Share2, Loader2, Copy, Check, X } from "lucide-react";
import { getUsername, saveUpdatedUsername } from "@/lib/username";

interface ShareDialogProps {
    onConfirm: () => Promise<void>;
    onClose: () => void;
    shareUrl?: string;
    isActive?: boolean;
    onStopSession?: () => void;
}

export const ShareDialog = ({
    onConfirm,
    onClose,
    shareUrl,
    isActive = false,
    onStopSession
}: ShareDialogProps) => {
    const [isCreating, setIsCreating] = useState(false);
    const [username, setUsername] = useState(getUsername());
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setUsername(getUsername());
    }, []);

    const handleConfirm = async () => {
        saveUpdatedUsername(username);

        setIsCreating(true);
        await onConfirm();
        setIsCreating(false);
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUsername = e.target.value;
        setUsername(newUsername);
        saveUpdatedUsername(newUsername);
    };

    const handleCopyLink = async () => {
        if (shareUrl) {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleStopSession = () => {
        if (onStopSession) {
            onStopSession();
        }
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-800"
                onClick={(e) => e.stopPropagation()}
            >
                {!isActive ? (

                    <>
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
                    </>
                ) : (

                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Session Active
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="size-5" />
                            </button>
                        </div>


                        <div className="space-y-2 mb-6">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={handleUsernameChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Others will see this name when you collaborate
                            </p>
                        </div>


                        {shareUrl && (
                            <div className="space-y-2 mb-6">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Share Link
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={shareUrl}
                                        readOnly
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:outline-none"
                                    />
                                    <button
                                        onClick={handleCopyLink}
                                        className="px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="size-4" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="size-4" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}


                        <button
                            onClick={handleStopSession}
                            className="w-full px-6 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                        >
                            Stop Session
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};