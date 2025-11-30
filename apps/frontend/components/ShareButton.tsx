"use client"

import { Share2 } from "lucide-react";
import { IconButton } from "./IconButton";

interface ShareButtonProps {
    onClick: () => void;
    isSharing:boolean
}

export const ShareButton = ({ onClick , isSharing }: ShareButtonProps) => {
    return (
        <div className={`top-5 right-20 absolute ${isSharing ? "text-green-500" : undefined}  dark:bg-[#1a1a1a] rounded-xl pointer shadow-even`}>
            <IconButton
                icon={<Share2 className="w-4 h-4" />}
                onClick={onClick}
                className="p-2 md:p-3"
            />
        </div>
    );
};
