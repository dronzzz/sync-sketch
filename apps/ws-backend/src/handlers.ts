import { redis } from "@repo/backend-common/config";
import { mouseMovement, parsedData, previewShape } from "./types/types"



export const handleJoinRoom = async (userId: string, parsedData: parsedData) => {

    await redis.sadd(`room:${parsedData.roomId}:userId`, userId);
}

export const handleLeaveRoom = async (userId: string, parsedData: parsedData) => {
    await redis.srem(`room:${parsedData.roomId}:userId`, userId);
}

export const handleChat = async (userId: string, socketMap: Map<string, WebSocket>, parsedData: parsedData) => {

    const roomMembers = await redis.smembers(`room:${parsedData.roomId}:userId`);
    let shape = {
                type: "chat",
                message: parsedData.message,
                roomId: parsedData.roomId,
                shapeId:parsedData.shapeId,
                shapeType:parsedData.shapeType,
                userId: userId

            }

    roomMembers.forEach(member => {
        const ws = socketMap.get(member);
        if(member === userId) {
            console.log('user with userId ',member,userId)
            return
        }
        
       
        if (ws) {
            ws.send(JSON.stringify(shape))
        }
    });



    await redis.lpush("messageQueue", JSON.stringify(shape))
}

export const handleMouseMovement = async (userId: string, socketMap: Map<string, WebSocket>, parsedData: mouseMovement) => {
    const roomMembers = await redis.smembers(`room:${parsedData.roomId}:userId`);



    roomMembers.forEach(member => {
        const ws = socketMap.get(member);
        
        if (ws) {
            ws.send(JSON.stringify({
                type: "mouseMovement",
                x: parsedData.x,
                y: parsedData.y,
                roomId: parsedData.roomId,
                userId

            }))
        }
    })

}

export const handleShapeUpdate = async (userId: string, socketMap: Map<string, WebSocket>, parsedData: parsedData) => {

   
    const roomMembers = await redis.smembers(`room:${parsedData.roomId}:userId`);
    
    let shape = {
                type: "shapeUpdate",
                message: parsedData.message,
                roomId: parsedData.roomId,
                shapeId: parsedData.shapeId,
                userId

            }

    roomMembers.forEach(member => {
        const ws = socketMap.get(member);
    



        if (ws) {
            ws.send(JSON.stringify(shape))
        }
    })

     await redis.lpush("messageQueue", JSON.stringify(shape))

}
export const handleShapePreview = async (userId: string, socketMap: Map<string, WebSocket>, parsedData: previewShape) => {

    
    const roomMembers = await redis.smembers(`room:${parsedData.roomId}:userId`);
    


    roomMembers.forEach(member => {
        const ws = socketMap.get(member);

        if (ws) {
            ws.send(JSON.stringify({
                type: "shapePreview",
                message: parsedData.message,
                roomId: parsedData.roomId,
                userId,
                previewType : parsedData.previewType

            }))
        }
    })

}

