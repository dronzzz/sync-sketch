"use client";
import React, { useState } from "react";
import { IconButton } from "./IconButton";
import { ArrowRight, Circle, Diamond, Eraser, Hand, MousePointer2, Pencil, RectangleHorizontalIcon, Slash, Type } from "lucide-react";
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
    const [showShapes, setShowShapes] = useState<boolean>(false);
    const shapeTools = ["rect", "ellipse", "diamond"];
    const isShapeSelected = shapeTools.includes(selectedTool);

    return (<>



        {
            showColorPicker && <ColorPicker setSelectedColor={setSelectedColor} />
        }
        {/* style={{ backgroundColor: "#1a1a1a" }} */}


        {showShapes && (
            <div className="hidden max-[420px]:flex absolute bottom-[70px] left-1/2 max-[370px]:left-[55%] max-[340px]:left-[60%] -translate-x-1/2 z-30 max-w-[calc(100vw-2rem)] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-row space-x-1 p-1 rounded-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-none shadow-subtle">
                <IconButton icon={<RectangleHorizontalIcon className="w-4 h-4 " />} activated={selectedTool === "rect"} onClick={() => { setSelectedTool("rect"); setShowShapes(false); }} />
                <IconButton icon={<Diamond className="w-4 h-4 " />} activated={selectedTool === "diamond"} onClick={() => { setSelectedTool("diamond"); setShowShapes(false); }} />
                <IconButton icon={<Circle className="w-4 h-4 " />} activated={selectedTool === "ellipse"} onClick={() => { setSelectedTool("ellipse"); setShowShapes(false); }} />
            </div>
        )}

        <div className="flex flex-row items-center space-x-1 cursor-pointer z-20 absolute max-w-[calc(100vw-2rem)] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bottom-4 right-6 translate-x-0 max-[420px]:right-1/2 max-[420px]:translate-x-1/2 p-1 rounded-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-none shadow-subtle">


            <IconButton icon={<Hand className="w-4 h-4  transform scale-y-120 stroke-[1.5]" />} activated={selectedTool === "panTool"}
                onClick={() => setSelectedTool("panTool")}
            />
            <div className="relative">


                <div
                    className="w-4 h-4  rounded-full"
                    style={{ backgroundColor: selectedColor.hex }}
                    onClick={() => setShowColorPicker(s => !s)}
                />
            </div>

            <IconButton icon={<MousePointer2 className="rotate-90 w-4 h-4 " />} activated={selectedTool === "pointer"} onClick={() => setSelectedTool("pointer")} />
            <IconButton icon={<Pencil className="w-4 h-4 " />} activated={selectedTool === "pencil"} onClick={() => setSelectedTool("pencil")} />
            <IconButton icon={<Eraser className="w-4 h-4 " />} activated={selectedTool === "eraser"} onClick={() => setSelectedTool("eraser")} />

            <div className="hidden max-[420px]:flex items-center">
                <IconButton
                    icon={<RectangleHorizontalIcon className="w-4 h-4" />}
                    activated={isShapeSelected || showShapes}
                    onClick={() => {
                        setShowShapes(!showShapes);
                        if (!isShapeSelected && !showShapes) setSelectedTool("rect");
                    }}
                />
            </div>

            <IconButton className="block max-[420px]:hidden" icon={<RectangleHorizontalIcon className="w-4 h-4 " />} activated={selectedTool === "rect"} onClick={() => setSelectedTool("rect")} />
            <IconButton className="block max-[420px]:hidden" icon={<Circle className="w-4 h-4 " />} activated={selectedTool === "ellipse"} onClick={() => setSelectedTool("ellipse")} />
            <IconButton className="block max-[420px]:hidden" icon={<Diamond className="w-4 h-4 " />} activated={selectedTool === "diamond"} onClick={() => setSelectedTool("diamond")} />

            <IconButton icon={<Slash className="w-4 h-4 " />} activated={selectedTool === "line"} onClick={() => setSelectedTool("line")} />
            <IconButton icon={<ArrowRight className="w-4 h-4 " />} activated={selectedTool === "arrow"} onClick={() => setSelectedTool("arrow")} />
            <IconButton icon={<Type className="w-4 h-4 " />} activated={selectedTool === "text"} onClick={() => setSelectedTool("text")} />
        </div>

    </>
    );
}

