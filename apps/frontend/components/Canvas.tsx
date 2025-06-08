"use client"

import { useEffect, useRef, useState } from "react";
import ToolBar, { MousePositionPointer } from "./ToolBar";
import { Game } from "@/draw/game";
import { useWindowSize } from "@/hooks/useWindowSize";

export type Tool = "rect" | "ellipse" | "line" | "pencil" | "pointer" | "panTool" | "text";

export default function Canvas({ roomId, socket, loading }: { roomId: string, socket: WebSocket, loading: boolean }) {
    const [selectedTool, setSelectedTool] = useState<Tool>('ellipse');
    const windowSize = useWindowSize();
    const [game, setGame] = useState<Game>();

    


    const canvasRef = useRef<HTMLCanvasElement>(null);

    //     useEffect(() => {
    //     if (canvasRef.current && windowSize.width && windowSize.height) {
    //         canvasRef.current.width = windowSize.width;
    //         canvasRef.current.height = windowSize.height;
    //     }
    // }, [windowSize]);

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
        <canvas ref={canvasRef} height={window.innerHeight} width={window.innerWidth} className="bg-[#0d0c09]"></canvas>
        <ToolBar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
        

        <div>
            {loading &&
                (<div className=" absolute w-screen h-screen flex justify-center items-center text-white z-30">
                    Connecting.....

                </div>)
            }
        </div>
    </div>
}