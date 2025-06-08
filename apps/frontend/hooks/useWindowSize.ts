"use client"
import { useEffect, useState } from "react";

export function useWindowSize(){
    const [windowSize, setWindowSize] = useState<{
        width: number | undefined;
        height: number | undefined;
    }>({
        width: undefined,
        height: undefined
    })

    useEffect(()=>{
        const handleResize = () =>{
            setWindowSize({
                width : window.innerWidth,
                height : window.innerHeight
            })
        }

        // handleResize();   //to get the widow res on initial load
        window.addEventListener('resize',  handleResize)

        return ()=>{
            window.removeEventListener('resize',handleResize)
        }
    },[])
    return windowSize;
}