import { redis } from "@repo/backend-common/config";
import {  mouseMovement, parsedData, previewShape } from "./types/types"
import { ClientSession } from "./socketServer";



export const handleJoinRoom = async (userId: string, parsedData: parsedData, sessionId: string) => {
    await redis.sadd(`room:${parsedData.roomId}:userId`, userId);
    await redis.set(`session:${sessionId}:room`, parsedData.roomId);
}

export const handleLeaveRoom = async (userId: string, parsedData: parsedData, sessionId: string) => {
    await redis.srem(`room:${parsedData.roomId}:userId`, userId);
    await redis.del(`session:${sessionId}:room`);
}

export const removeUserFromRoom = async (userId: string,sessionId:string) => {
    const roomId = await redis.get(`session:${sessionId}:room`);
    await redis.srem(`room:${roomId}:userId`, userId);
    if (roomId) {
        await removeUserFromRoom(userId, roomId);
        await redis.del(`session:${sessionId}:room`);
    }
}



export const handleChat = async (userId: string, sessions: Map<string, ClientSession>, userSessions: Map<string, Set<string>>, parsedData: parsedData,currentSessionId:string) => {

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
                const memberSessions = userSessions.get(member);
                console.log("memberSessions",memberSessions)
                if (memberSessions) {
                    memberSessions.forEach(sessionId => {
                    
                        if (member === userId && sessionId === currentSessionId) {
                            console.log('Skipping user with session id',sessionId)
                            return;
                        }

                        console.log('sending message to sessino id ',sessionId)
                        
                        const session = sessions.get(sessionId);
                        if (session?.ws.readyState === WebSocket.OPEN) {
                            session.ws.send(JSON.stringify(shape));
                        }
                    });
                }
            });



    await redis.lpush("messageQueue", JSON.stringify(shape))
}

export const handleMouseMovement = async (userId: string, sessions: Map<string, ClientSession>, userSessions: Map<string, Set<string>>, parsedData: mouseMovement,currentSessionId:string) => {
    const roomMembers = await redis.smembers(`room:${parsedData.roomId}:userId`);



    roomMembers.forEach(member => {
        const memberSessions = userSessions.get(member);
        if(!memberSessions) return

        memberSessions.forEach(sessionId =>{
            if (member === userId && sessionId === currentSessionId) {

                return;
            }


            const session = sessions.get(sessionId);
            if(session?.ws.readyState === WebSocket.OPEN){
                session.ws.send(JSON.stringify({
                    type: "mouseMovement",
                    x: parsedData.x,
                    y: parsedData.y,
                    roomId: parsedData.roomId,
                    userId
    
                }))
            }
        })
        
        
    })

}

export const handleShapeUpdate = async (userId: string, sessions: Map<string, ClientSession>, userSessions: Map<string, Set<string>>, parsedData: parsedData,currentSessionId:string) => {

   
    const roomMembers = await redis.smembers(`room:${parsedData.roomId}:userId`);
    
    let shape = {
                type: "shapeUpdate",
                message: parsedData.message,
                roomId: parsedData.roomId,
                shapeId: parsedData.shapeId,
                userId

            }

            roomMembers.forEach(member => {
                const memberSessions = userSessions.get(member);
                if (memberSessions) {
                    memberSessions.forEach(sessionId => {
                    
                        if (member === userId && sessionId === currentSessionId) {

                            return;
                        }
        
                        const session = sessions.get(sessionId);
                        if (session?.ws.readyState === WebSocket.OPEN) {
                            session.ws.send(JSON.stringify(shape));
                        }
                    });
                }
            })

     await redis.lpush("messageQueue", JSON.stringify(shape))

}
export const handleShapePreview = async (userId: string, sessions: Map<string, ClientSession>, userSessions: Map<string, Set<string>>, parsedData: previewShape,currentSessionId:string) => {

    
    const roomMembers = await redis.smembers(`room:${parsedData.roomId}:userId`);
    


    roomMembers.forEach(member => {
        const memberSessions = userSessions.get(member);
        if (memberSessions) {
            memberSessions.forEach(sessionId => {
            
                if (member === userId && sessionId === currentSessionId) {

                    return;
                }

                const session = sessions.get(sessionId);
                if (session?.ws.readyState === WebSocket.OPEN) {
                    session.ws.send(JSON.stringify({
                        type: "shapePreview",
                        message: parsedData.message,
                        roomId: parsedData.roomId,
                        userId,
                        previewType: parsedData.previewType
                    }));
                }
            });
        }
    });

}

