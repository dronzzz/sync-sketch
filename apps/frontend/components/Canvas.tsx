"use client"

import { useEffect, useRef, useState } from "react";
import ToolBar, { MousePositionPointer } from "./ToolBar";
import { Game } from "@/draw/game";
import { useWindowSize } from "@/hooks/useWindowSize";
import { Color } from "./ColorPicker";
import { ToggleTheme } from "./ToggleTheme";
import { useTheme } from "next-themes";

export type Tool = "rect" | "ellipse" | "line" | "pencil" | "pointer" | "panTool" | "text";

export default function Canvas({ roomId, socket, loading }: { roomId: string, socket: WebSocket, loading: boolean }) {
    const [selectedTool, setSelectedTool] = useState<Tool>('ellipse');
    const [selectedColor, setSelectedColor] = useState<Color>({ hex: "#3d3c3a" });
    const windowSize = useWindowSize();
    const [game, setGame] = useState<Game>();
    const { theme } = useTheme();

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [game, selectedTool]);

    useEffect(() => {
        game?.setColor(selectedColor);
    }, [selectedColor]);

    useEffect(() => {
        if (game) {
            if (theme === "dark") {
                game.setTheme("#0d0c09");
            } else {
                game.setTheme("#ffffff");
            }
        }
    }, [theme, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, socket, roomId);
            setGame(g);
            return () => {
                g?.destroy();
            };
        }
    }, [canvasRef]);

    return (
        <div className="relative w-full h-screen overflow-hidden">
            <canvas ref={canvasRef} height={window.innerHeight} width={window.innerWidth} className="bg-white dark:bg-[#0d0c09] touch-none"
            />
            
            <ToolBar
                setSelectedTool={setSelectedTool}
                selectedTool={selectedTool}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
            />
            
            <ToggleTheme />

            {loading && (
                <div className="fixed inset-0 flex justify-center items-center text-black dark:text-white z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                    <div className="text-center">
                        <div className="text-lg md:text-xl">Connecting...</div>
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">Please wait</div>
                    </div>
                </div>
            )}
        </div>
    );
}