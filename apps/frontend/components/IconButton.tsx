import { ReactNode } from "react"

export function IconButton ({icon,onClick,activated}:{
    icon : ReactNode,
    onClick: () =>void,
    activated : boolean
}){

    return <div className={`pointer p-3 hover:bg-[#444444] rounded-md  ${activated ?  "text-green-500 bg-[#333333]" : "text-white"}`} onClick={onClick}>
       {icon}
    </div>
}