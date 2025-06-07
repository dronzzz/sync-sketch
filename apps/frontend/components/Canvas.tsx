"use client"

import { useEffect, useRef, useState } from "react";
import ToolBar from "./ToolBar";
import { Game } from "@/draw/game";

export type Tool = "rect" | "ellipse" | "line" | "pencil" | "pointer";

export default function Canvas({ roomId, socket }: { roomId: string, socket: WebSocket }) {
    const [selectedTool, setSelectedTool] = useState<Tool>('ellipse');
    const [game, setGame] = useState<Game>();

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        game?.setTool(selectedTool)
    }, [game, selectedTool])


    useEffect(() => {


        if (canvasRef.current) {
            const g = new Game(canvasRef.current, socket, roomId)
            setGame(g);

            return () => {
                g?.destroy();
            }
        }

    }, [canvasRef]);


    return <div>
        <canvas ref={canvasRef} height={1000} width={1000} ></canvas>
        <ToolBar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
    </div>
}