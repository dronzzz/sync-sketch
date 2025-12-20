import { redis } from "@repo/backend-common/config";
import { mouseMovement, parsedData, previewShape } from "./types/types"
import { ClientSession } from "./socketServer";



export const handleJoinRoom = async (session: ClientSession, parsedData: parsedData) => {
    const { sessionId, username, roomId: currentRoom } = session;
    const targetRoomId = parsedData.roomId;


    await redis.sadd(`room:${targetRoomId}:sessions`, sessionId);


    await redis.set(`session:${sessionId}:room`, targetRoomId);


    session.roomId = targetRoomId;

    console.log(`${username} joined room ${targetRoomId}`);
}

export const handleLeaveRoom = async (session: ClientSession, parsedData: parsedData) => {
    const { sessionId, username } = session;
    const roomId = parsedData.roomId;

    await redis.srem(`room:${roomId}:sessions`, sessionId);
    await redis.del(`session:${sessionId}:room`);

    session.roomId = null;

    console.log(`${username} left room ${roomId}`);
}

export const removeUserFromRoom = async (sessionId: string) => {
    const roomId = await redis.get(`session:${sessionId}:room`);

    if (roomId) {

        await redis.srem(`room:${roomId}:sessions`, sessionId);
        await redis.del(`session:${sessionId}:room`);


        const remainingUsers = await redis.scard(`room:${roomId}:sessions`);
        if (remainingUsers === 0) {
            console.log(`Room ${roomId} is  empty, cleaning up...`);
            await redis.del(`room:${roomId}:sessions`);

        }
    }
}



export const handleChat = async (session: ClientSession, sessions: Map<string, ClientSession>, parsedData: parsedData) => {
    const { sessionId, username } = session;
    const roomId = parsedData.roomId;


    const roomSessions = await redis.smembers(`room:${roomId}:sessions`);

    const shape = {
        type: "chat",
        message: parsedData.message,
        roomId: parsedData.roomId,
        shapeId: parsedData.shapeId,
        shapeType: parsedData.shapeType,
        username,
        sessionId
    }


    roomSessions.forEach(targetSessionId => {
        if (targetSessionId === sessionId) {

            return;
        }

        const targetSession = sessions.get(targetSessionId);
        if (targetSession?.ws.readyState === WebSocket.OPEN) {
            targetSession.ws.send(JSON.stringify(shape));
        }
    });


    await redis.lpush("messageQueue", JSON.stringify({
        ...shape,
        userId: session.userId
    }))
}

export const handleMouseMovement = async (session: ClientSession, sessions: Map<string, ClientSession>, parsedData: mouseMovement) => {
    const { sessionId, username } = session;
    const roomId = parsedData.roomId;

    const roomSessions = await redis.smembers(`room:${roomId}:sessions`);

    roomSessions.forEach(targetSessionId => {
        if (targetSessionId === sessionId) {
            return;
        }

        const targetSession = sessions.get(targetSessionId);
        if (targetSession?.ws.readyState === WebSocket.OPEN) {
            targetSession.ws.send(JSON.stringify({
                type: "mouseMovement",
                x: parsedData.x,
                y: parsedData.y,
                roomId: parsedData.roomId,
                username,
                sessionId
            }))
        }
    })

}

export const handleShapeUpdate = async (session: ClientSession, sessions: Map<string, ClientSession>, parsedData: parsedData) => {
    const { sessionId, username } = session;
    const roomId = parsedData.roomId;

    const roomSessions = await redis.smembers(`room:${roomId}:sessions`);

    const shape = {
        type: "shapeUpdate",
        message: parsedData.message,
        roomId: parsedData.roomId,
        shapeId: parsedData.shapeId,
        username,
        sessionId
    }

    roomSessions.forEach(targetSessionId => {
        if (targetSessionId === sessionId) {
            return;
        }

        const targetSession = sessions.get(targetSessionId);
        if (targetSession?.ws.readyState === WebSocket.OPEN) {
            targetSession.ws.send(JSON.stringify(shape));
        }
    });

    await redis.lpush("messageQueue", JSON.stringify({
        ...shape,
        userId: session.userId
    }));

}

export const handleShapeDelete = async (session: ClientSession, sessions: Map<string, ClientSession>, parsedData: parsedData) => {
    const { sessionId, username } = session;
    const roomId = parsedData.roomId;

    const roomSessions = await redis.smembers(`room:${roomId}:sessions`);

    const deleteMessage = {
        type: "shapeDelete",
        roomId: parsedData.roomId,
        shapeId: parsedData.shapeId,
        username,
        sessionId
    }

    roomSessions.forEach(targetSessionId => {
        if (targetSessionId === sessionId) {
            return;
        }

        const targetSession = sessions.get(targetSessionId);
        if (targetSession?.ws.readyState === WebSocket.OPEN) {
            targetSession.ws.send(JSON.stringify(deleteMessage));
        }
    });

    await redis.lpush("messageQueue", JSON.stringify({
        ...deleteMessage,
        userId: session.userId
    }));
}

export const handleShapePreview = async (session: ClientSession, sessions: Map<string, ClientSession>, parsedData: previewShape) => {
    const { sessionId, username } = session;
    const roomId = parsedData.roomId;

    const roomSessions = await redis.smembers(`room:${roomId}:sessions`);

    roomSessions.forEach(targetSessionId => {
        if (targetSessionId === sessionId) {
            return;
        }

        const targetSession = sessions.get(targetSessionId);
        if (targetSession?.ws.readyState === WebSocket.OPEN) {
            targetSession.ws.send(JSON.stringify({
                type: "shapePreview",
                message: parsedData.message,
                roomId: parsedData.roomId,
                username,
                sessionId,
                previewType: parsedData.previewType
            }));
        }
    });

}
