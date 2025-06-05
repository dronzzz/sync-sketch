

import React, { useEffect, useState } from 'react'
import { WS_URL } from '../config';

export default function useSocket() {
    const [socket, setSocket] = useState<WebSocket>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        ws.onopen = () => {
            setLoading(false);
            setSocket(ws)
        }



    }, [])
    return { loading, socket };
}
