"use client"
import { WS_URL } from "@/config";
import { useEffect, useState } from "react";

export function useSocket(){
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
       
        const cleanup = () => {
            if (socket) {
                socket.close();
                setSocket(null);
                setSessionId(null);
            }
        };

       
        const handleBeforeUnload = () => {
            cleanup();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        const ws = new WebSocket(WS_URL);
        
        ws.onopen = () => {
            console.log('WebSocket connection established');
            setSocket(ws);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('Socket message received:', message);
                
                if (message.type === "session-init") {
                    console.log('Session initialized with ID:', message.sessionId);
                    setSessionId(message.sessionId);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error parsing socket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            cleanup();
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
            cleanup();
        };

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            cleanup();
        };
    }, []);

    return { loading, socket, sessionId };
}