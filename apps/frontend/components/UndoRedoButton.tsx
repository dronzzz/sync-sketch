import { CornerUpLeft, CornerUpRight } from "lucide-react"
import { IconButton } from "./IconButton"
import { Game } from "@/draw/game"

export const UndoRedoButton = ({ game }: { game: Game }) => {
    return <div className="flex flex-row items-center space-x-1 cursor-pointer z-20 absolute bottom-[70px] left-4 sm:bottom-4 sm:left-6 p-1 rounded-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-none shadow-subtle">
        <IconButton icon={<CornerUpLeft className=" w-4 h-4 " />} onClick={() => game.undo()} />
        <IconButton icon={<CornerUpRight className=" w-4 h-4 " />} onClick={() => game.redo()} />
    </div>

}