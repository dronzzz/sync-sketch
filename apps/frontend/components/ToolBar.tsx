"use client";
import React, { useState } from "react";
import { IconButton } from "./IconButton";
import { Circle, Hand, MousePointer2, Pencil, RectangleHorizontalIcon, Slash, Type } from "lucide-react";
import { Tool } from "./Canvas";
import ColorPicker, { Color } from "./ColorPicker";



export default function ToolBar({
    setSelectedTool,
    selectedTool,
    selectedColor,
    setSelectedColor
}: {
    setSelectedTool: React.Dispatch<React.SetStateAction<Tool>>;
    selectedTool: string;
    selectedColor: Color;
    setSelectedColor: React.Dispatch<React.SetStateAction<Color>>;

}) {
    const [showColorPicker, setShowColorPicker] = useState<boolean>()
    return (<>

        {
            showColorPicker && <ColorPicker setSelectedColor={setSelectedColor} />
        }
        {/* style={{ backgroundColor: "#1a1a1a" }} */}

        
<div className="flex flex-row items-center space-x-1 cursor-pointer z-20 absolute bottom-4 right-1/2 translate-x-1/2 sm:right-6 sm:translate-x-0 p-1 sm:p-2 rounded-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-none shadow-subtle">


            <IconButton icon={<Hand className="w-4 h-4 sm:w-5 sm:h-5 transform scale-y-120 stroke-[1.5]" />} activated={selectedTool === "panTool"}
                onClick={() => setSelectedTool("panTool")}
            />
            <div className="relative">


            <div
                className="w-4 h-4 sm:w-6 sm:h-6 rounded-full"
                style={{ backgroundColor: selectedColor.hex }}
                onClick={() => setShowColorPicker(s => !s)}
                />
                </div>

            <IconButton icon={<Pencil className="w-4 h-4 sm:w-5 sm:h-5" />} activated={selectedTool === "pencil"} onClick={() => setSelectedTool("pencil")} />
            <IconButton icon={<RectangleHorizontalIcon className="w-4 h-4 sm:w-6 sm:h-6" />} activated={selectedTool === "rect"} onClick={() => setSelectedTool("rect")} />
            <IconButton icon={<Circle className="w-4 h-4 sm:w-6 sm:h-6" />} activated={selectedTool === "ellipse"} onClick={() => setSelectedTool("ellipse")} />
            <IconButton icon={<Slash className="w-4 h-4 sm:w-6 sm:h-6" />} activated={selectedTool === "line"} onClick={() => setSelectedTool("line")} />
            <IconButton icon={<Type className="w-4 h-4 sm:w-6 sm:h-6" />} activated={selectedTool === "text"} onClick={() => setSelectedTool("text")} />
            <IconButton icon={<MousePointer2 className="rotate-90 w-4 h-4 sm:w-6 sm:h-6" />} activated={selectedTool === "pointer"} onClick={() => setSelectedTool("pointer")} />
        </div>
    </>
    );
}

export function MousePositionPointer({ height, width }: { height: number; width: number }) {
    return (
        <div
            className="absolute z-40 pointer-events-none flex flex-col items-center"
            style={{
                top: height,
                left: width,
                transform: "translate(-50%, -100%)", // center above the pointer
            }}
        >
            <MousePointer2
                className="rotate-90 text-blue-500"
                style={{
                    height: "20px",
                    width: "20px",
                }}
            />
            <div className="bg-blue-500 text-white text-xs px-1 rounded mt-1">
                Anonymous
            </div>
        </div>
    );
}
