import { ReactNode } from "react"

export function IconButton({ icon, onClick, activated, className }: {
    icon: ReactNode,
    onClick: () => void,
    activated?: boolean,
    className?: string
}) {

    return <div className={`pointer p-3 hover:bg-gray-200    dark:hover:bg-[#444444] rounded-xl  ${activated ? "text-green-500 bg-gray-300  dark:bg-[#333333] " : "text-white"}${className}`} onClick={onClick}>
        {icon}
    </div>
}