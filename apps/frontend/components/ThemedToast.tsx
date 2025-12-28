"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function ThemedToast() {
    const { resolvedTheme } = useTheme();

    return (
        <Toaster
            position="bottom-right"
            theme={(resolvedTheme as 'light' | 'dark' | 'system') || 'system'}
        />
    );
}
