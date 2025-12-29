"use client"
import { WS_URL } from "@/config";
import { getUsername } from "@/lib/username";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function useSocket(roomId?: string) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const manuallyClosed = useRef<boolean>(false);
    const attempt = useRef<number>(0);
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!roomId) {
            return;
        }

        manuallyClosed.current = false;
        attempt.current = 0;

        setLoading(true);

        let ws: WebSocket | null = null;

        const cleanup = () => {
            manuallyClosed.current = true;
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            setSocket(null);
            setSessionId(null);
            setUsername(null);
            setLoading(false);
        };

        const connect = () => {
            if (attempt.current > 5) {
                toast.error("Failed to connect to server. Refresh");
                return;
            }
            const currentUsername: string = getUsername();

            ws = new WebSocket(WS_URL + `?username=${currentUsername}`);
            wsRef.current = ws;
            ws.onopen = () => {
                setSocket(ws);
                attempt.current = 0;
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
            };

            ws.onclose = () => {
                console.log('WebSocket connection closed');
                if (manuallyClosed.current) return;
                console.log('attempt', attempt.current);

                reconnectTimerRef.current = setTimeout(connect, Math.min(10000, 1000 * Math.pow(2, attempt.current)));
                attempt.current++;

            };
        }

        connect();
        const handleOnline = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) return;
            if (manuallyClosed.current) return;
            console.log("Network online detected!");
            connect();
        };
        window.addEventListener('online', handleOnline);

        return () => {
            cleanup();
        };
    }, [roomId]);

    return { loading, socket, sessionId, username };
}