"use client"

import { useEffect, useRef, useState } from "react";
import ToolBar from "./ToolBar";
import { Game } from "@/draw/game";
import { useWindowSize } from "@/hooks/useWindowSize";
import { Color } from "./ColorPicker";
import { ToggleTheme } from "./ToggleTheme";
import { useTheme } from "next-themes";
import MousePositionPointer from "./MousePositionPointer";

export type Tool = "rect" | "ellipse" | "line" | "pencil" | "pointer" | "panTool" | "text";

export default function Canvas({ roomId, socket, loading }: { roomId: string, socket: WebSocket | null, loading: boolean }) {
    const [selectedTool, setSelectedTool] = useState<Tool>('ellipse');
    const [selectedColor, setSelectedColor] = useState<Color>({ hex: "#3d3c3a" });
    const windowSize = useWindowSize();
    const [game, setGame] = useState<Game | null>(null);
    const { theme } = useTheme();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(()=>{
        if(game){
            game.clearCanvas()
        }
    },[windowSize])

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
        if (canvasRef.current &&!game && theme && socket ) {
            const g = new Game(canvasRef.current, socket, roomId);
            setGame(g);
            return () => {
                g?.destroy();
            };
        }
    }, [canvasRef,socket]);

    return (
        <div className="relative w-full h-screen overflow-hidden">
            <canvas ref={canvasRef} height={windowSize.height} width={windowSize.width} className="bg-white dark:bg-[#0d0c09] touch-none"
            />
            
            <ToolBar
                setSelectedTool={setSelectedTool}
                selectedTool={selectedTool}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
            />
            
            <ToggleTheme />
            <MousePositionPointer/>
            

            {loading && (() => {
           
            return (
                <div className="fixed inset-0 flex justify-center items-center text-black dark:text-white z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                    <div className="text-center">
                        <div className="text-lg md:text-xl text-black dark:text-white">Connecting...</div>
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">Please wait</div>
                    </div>
                </div>
            );
        })()}
        </div>
    );
}