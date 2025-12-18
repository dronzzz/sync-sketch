"use client"

import { useTheme } from "next-themes";

export type Color = {
    hex: string;

};
const colors = [
    { hex: "#1f1f1f" },
    { hex: "#ef9292" },
    { hex: "#92ee92" },
    { hex: "#9b9bfd" },
    { hex: "#fefe9c" },
    { hex: "#fd9bfc" },
    { hex: "#9cfefe" },
    { hex: "#d3d3d3" },
]
export default function ColorPicker({
    setSelectedColor,
}: {

    setSelectedColor: (color: Color) => void;
}) {
    const { resolvedTheme } = useTheme()

    const isDark = resolvedTheme === "dark";

    const visibleColors = colors.filter(c => {
        if (c.hex === "#1f1f1f") return !isDark;
        if (c.hex === "#d3d3d3") return isDark;
        return true;
    });
    return (

        <div
            className="flex flex-row cursor-pointer absolute bottom-18 right-29.5 sm:bottom-18 sm:right-15 rounded-md dark:bg-[#1a1a1a] shadow-even"
        >
            {visibleColors.map((color) => (
                <div
                    key={color.hex}
                    className="w-4 h-4 m-2 rounded-full hover:scale-120 "
                    style={{ backgroundColor: color.hex }}
                    onClick={() => setSelectedColor(color)}
                />
            ))}
        </div>
    );
}

