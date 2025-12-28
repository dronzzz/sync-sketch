import { redis } from "@repo/backend-common/config";
import { mouseMovement, parsedData, previewShape } from "./types/types"
import { ClientSession } from "./socketServer";



export const handleJoinRoom = async (session: ClientSession, parsedData: parsedData, sessions: Map<string, ClientSession>) => {
    const { sessionId, username, roomId: currentRoom } = session;
    const targetRoomId = parsedData.roomId;

    await redis.pipeline()
        .sadd(`room:${targetRoomId}:sessions`, sessionId)
        .set(`session:${sessionId}:room`, targetRoomId)
        .exec();

    session.roomId = targetRoomId;

    await Promise.all([
        broadcastToRoom(session, { type: "new-user", sessionId }, sessions),
        broadcastAllRoomMembers(targetRoomId, sessions)
    ]);

    console.log(`${username} joined room ${targetRoomId}`);
}

export const removeUserFromRoom = async (sessionId: string, sessions: Map<string, ClientSession>) => {
    const roomId = await redis.get(`session:${sessionId}:room`);

    if (roomId) {
        await redis.pipeline()
            .srem(`room:${roomId}:sessions`, sessionId)
            .del(`session:${sessionId}:room`)
            .exec();

        sessions.delete(sessionId);

        const remainingUsers = await redis.scard(`room:${roomId}:sessions`);
        if (remainingUsers === 0) {
            console.log(`Room ${roomId} is  empty, cleaning up...`);
            await redis.del(`room:${roomId}:sessions`);
        } else {
            await broadcastAllRoomMembers(roomId, sessions);
        }
    }
}

export const handleChat = async (session: ClientSession, sessions: Map<string, ClientSession>, parsedData: parsedData) => {

    const shape: any = {
        type: "chat",
        message: parsedData.message,
    }

    await broadcastToRoom(session, shape, sessions);

    shape.shapeId = parsedData.shapeId;
    shape.shapeType = parsedData.shapeType;
    await pushToQueue(session, shape);
}

export const handleMouseMovement = async (session: ClientSession, sessions: Map<string, ClientSession>, parsedData: mouseMovement) => {
    const { sessionId } = session;

    const shape = {
        type: "mouseMovement",
        x: parsedData.x,
        y: parsedData.y,
        sessionId,
        username: session.username
    }

    await broadcastToRoom(session, shape, sessions);

}

export const handleShapeUpdate = async (session: ClientSession, sessions: Map<string, ClientSession>, parsedData: parsedData) => {

    const shape: any = {
        type: parsedData.type,
        message: parsedData.message,
    }

    await broadcastToRoom(session, shape, sessions);

    if ((parsedData.type as any) !== 'scene-update') {

        shape.shapeId = parsedData.shapeId;
        await pushToQueue(session, shape);
    }
}

export const handleShapePreview = async (session: ClientSession, sessions: Map<string, ClientSession>, parsedData: previewShape) => {

    const shape = {
        type: "shapePreview",
        message: parsedData.message,
        previewType: parsedData.previewType
    }

    await broadcastToRoom(session, shape, sessions);

}

const pushToQueue = async (session: ClientSession, shape: any) => {
    await redis.lpush("messageQueue", JSON.stringify({
        ...shape,
        userId: session.userId,
        roomId: session.roomId
    }));
}



const broadcastToRoom = async (
    session: ClientSession,
    message: object,
    sessions: Map<string, ClientSession>
) => {
    const { sessionId, roomId } = session;
    const roomSessions = await redis.smembers(`room:${roomId}:sessions`);

    for (const targetSessionId of roomSessions) {
        if (targetSessionId === sessionId) continue;

        const targetSession = sessions.get(targetSessionId);


        if (targetSession?.ws.readyState === WebSocket.OPEN) {
            targetSession.ws.send(JSON.stringify(message));
        }
        else if (!targetSession) {
            console.log(`Cleaning stale session: ${targetSessionId}`);
            await removeUserFromRoom(targetSessionId, sessions);
        }
    }
};

const broadcastAllRoomMembers = async (roomId: string, sessions: Map<string, ClientSession>) => {
    const roomSessions = await redis.smembers(`room:${roomId}:sessions`);


    const users = roomSessions
        .filter(sessionId => sessions.has(sessionId))
        .map(sessionId => {
            const session = sessions.get(sessionId)!;
            return {
                sessionId: session.sessionId,
                username: session.username
            };
        });

    const message = {
        type: "room-users",
        users
    };

    for (const targetSessionId of roomSessions) {
        const targetSession = sessions.get(targetSessionId);
        if (targetSession?.ws.readyState === WebSocket.OPEN) {
            targetSession.ws.send(JSON.stringify(message));
        }
    }


}

export const handleSceneInit = async (session: ClientSession, sessions: Map<string, ClientSession>, parsedData: parsedData) => {

    if (parsedData.targetUserId) {
        const targetSession = sessions.get(parsedData.targetUserId);
        if (targetSession?.ws.readyState === WebSocket.OPEN) {
            targetSession.ws.send(JSON.stringify({
                type: "scene-init",
                shapes: parsedData.message,
                fromUser: session.sessionId
            }));
        }
    }

}