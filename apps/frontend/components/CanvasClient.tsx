"use client"
import React from 'react'
import Canvas from './Canvas'
import { useSocket } from '@/hooks/useSocket';

export default function CanvasClient({ roomId }: { roomId: string }) {
    const { loading, socket } = useSocket();
    
    if (socket && !loading) {
        socket.send(JSON.stringify({
            type: "join_room",
            roomId,
        }))
    }
    // if (!socket) {
    //     return null
    // }
  


    return (
        <Canvas roomId={roomId} socket={socket} loading={loading} />
    )
}
