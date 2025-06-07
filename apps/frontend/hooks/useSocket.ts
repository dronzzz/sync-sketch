"use client"
import { WS_URL } from "@/config";
import { useEffect, useState } from "react";

export function useSocket(){

    const [socket ,setSocket] = useState<WebSocket | null >(null)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(()=>{
       
        const ws = new WebSocket(WS_URL);
        ws.onopen = () =>{
            setSocket(ws);
            setLoading(false);
        }
    },[])
    return {loading,socket}
 }