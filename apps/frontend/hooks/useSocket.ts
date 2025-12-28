"use client"
import { WS_URL } from "@/config";
import { getUsername } from "@/lib/username";
import { useEffect, useState } from "react";

export function useSocket(roomId?: string) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        if (!roomId) {
            return;
        }

        setLoading(true);

        let ws: WebSocket | null = null;

        const cleanup = () => {
            if (ws) {
                ws.close();
                ws = null;
            }
            setSocket(null);
            setSessionId(null);
            setUsername(null);
            setLoading(false);
        };


        const currentUsername: string = getUsername();

        ws = new WebSocket(WS_URL + `?username=${currentUsername}`);


        ws.onopen = () => {

            setSocket(ws);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);


                if (message.type === "session-init") {
                    console.log('Session initialized with ID:', message.sessionId);
                    setSessionId(message.sessionId);
                    setUsername(message.username);
                    setLoading(false);

                    if (roomId) {

                        ws?.send(JSON.stringify({
                            type: "join_room",
                            roomId
                        }));
                    }
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
            cleanup();
        };
    }, [roomId]);

    return { loading, socket, sessionId, username };
}