"use client"

import { Share2 } from "lucide-react";
import { IconButton } from "./IconButton";

interface ShareButtonProps {
    onClick: () => void;
}

export const ShareButton = ({ onClick }: ShareButtonProps) => {
    return (
        <div className="top-5 right-20 absolute dark:bg-[#1a1a1a] rounded-xl pointer shadow-even">
            <IconButton
                icon={<Share2 className="w-4 h-4" />}
                onClick={onClick}
                className="p-2 md:p-3"
            />
        </div>
    );
};
