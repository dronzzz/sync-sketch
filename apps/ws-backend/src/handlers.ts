import { redis } from "@repo/backend-common/config";
import { parsedData } from "./types/types"



export const handleJoinRoom = async (userId: string, parsedData: parsedData) => {

    await redis.sadd(`room:${parsedData.roomId}:userId`, userId);
}

export const handleLeaveRoom = async (userId: string, parsedData: parsedData) => {
    await redis.srem(`room:${parsedData.roomId}:userId`, userId);
}

export const handleChat = async (userId: string, socketMap: Map<string, WebSocket>, parsedData: parsedData) => {

    const roomMembers = await redis.smembers(`room:${parsedData.roomId}:userId`);

    roomMembers.forEach(member => {
        const ws = socketMap.get(member);
        console.log('ws', ws);
        if (ws) {
            ws.send(JSON.stringify({
                type: "chat",
                message: parsedData.message,
                roomId: parsedData.roomId,
                userId: userId

            }))
        }
    });



    await redis.lpush("messageQueue", JSON.stringify({
        type: "chat",
        roomId: parsedData.roomId,
        message: parsedData.message,
        userId: userId
    }))
}