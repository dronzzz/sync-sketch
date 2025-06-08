"use client";
import React from "react";
import { IconButton } from "./IconButton";
import {  Circle, Hand, MousePointer2,  RectangleHorizontalIcon, Slash } from "lucide-react";
import { Tool } from "./Canvas";

export default function ToolBar({
    setSelectedTool,
    selectedTool,
}: {
    setSelectedTool: React.Dispatch<React.SetStateAction<Tool>>;
    selectedTool: string;
}) {
    return (
        <div
            className="flex flex-row z-20 absolute bottom-6 right-6 items-center space-x-2 rounded-md p-2"
            style={{ backgroundColor: "#1a1a1a" }}
        >
            <IconButton icon={<Hand/>}  activated={selectedTool === "panTool" ? true : false} onClick={()=> setSelectedTool("panTool")}/>
            <IconButton icon={<RectangleHorizontalIcon/>}  activated={selectedTool === "rect" ? true : false} onClick={()=> setSelectedTool("rect")}/>
            <IconButton icon={<Circle/>}  activated={selectedTool === "ellipse" ? true : false} onClick={()=> setSelectedTool("ellipse")}/>
            <IconButton icon={<Slash/>}  activated={selectedTool === "line" ? true : false} onClick={()=> setSelectedTool("line")}/>
            <IconButton icon={<MousePointer2 className="rotate-90"/>}  activated={selectedTool === "pointer" ? true : false} onClick={()=> setSelectedTool("pointer")}/>
        </div>
    );
}
