import jwt from 'jsonwebtoken';
import { WebSocketServer, WebSocket } from 'ws';
import { handleChat, handleJoinRoom, handleMouseMovement, handleShapePreview, handleShapeUpdate, handleShapeDelete, removeUserFromRoom, handleSceneInit } from './handlers';
// import { JWT_SECRET } from '@repo/backend-common/config';


export interface ClientSession {
    sessionId: string;
    username: string;
    userId?: string;
    roomId: string | null;
    ws: WebSocket;
}

export class SocketServer {
    private static instance: SocketServer;
    private wss: WebSocketServer;
    private sessions: Map<string, ClientSession> = new Map();




    private constructor() {
        this.wss = new WebSocketServer({ port: 8080 });
        this.wss.on('connection', this.handleConnection);
    }

    public static getInstance() {
        if (!SocketServer.instance) {
            SocketServer.instance = new SocketServer();
        }
        return SocketServer.instance

    }


    // private checkUser = (token: string) => {    //currently auth removed -> might need in future 
    //     try {
    //         const decoded = jwt.verify(token, JWT_SECRET);
    //         if (typeof decoded == "string") {
    //             return null
    //         }
    //         if (!decoded || !decoded.userId) {
    //             return null;
    //         }
    //         return decoded.userId;
    //     } catch (error) {
    //         return null;
    //     }
    // }

    private cleanUpSession = async (sessionId: string) => {
        const session = this.sessions.get(sessionId)
        if (!session) return;


        if (session.roomId) {
            await removeUserFromRoom(sessionId, this.sessions);
        }


        this.sessions.delete(sessionId)
    }

    private heartBeat = (sessionId: string) => {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const pingInterval = setInterval(() => {
            if (session?.ws.readyState === WebSocket.OPEN) {
                session.ws.ping();
            } else {
                this.cleanUpSession(sessionId);
                clearInterval(pingInterval)

            }

        }, 30000)
        session.ws.on('pong', () => {

        });
    }

    private handleConnection = (ws: WebSocket, request: any) => {
        const url = request.url;
        console.log(url)
        if (!url) {
            return
        }

        const queryParam = new URLSearchParams(url.split("?")[1]);


        const username = queryParam.get('username') || 'anonymous';


        // const token = queryParam.get('token') || "";
        // const userId = this.checkUser(token);
        // if (userId == null) {
        //     ws.close();
        //     return;
        // }

        const sessionId = crypto.randomUUID();
        const session: ClientSession = {
            sessionId,
            username,
            userId: undefined,
            roomId: null,
            ws
        }
        this.sessions.set(sessionId, session)

        ws.send(JSON.stringify({
            type: "session-init",
            sessionId,
        }));

        this.heartBeat(sessionId)
        console.log('setting sesssion id as -----------------------------', sessionId)

        ws.on('error', console.error);
        ws.on('message', (data) => this.handleMessage(data, sessionId));
        ws.on('close', (data) => this.handleClose(ws))

    }

    private handleClose = (ws: WebSocket) => {
        console.log('[SOCKET] WebSocket closing, cleaning up session...');

        // Find and cleanup session in background (don't block close handshake)
        Object.entries(this.sessions).forEach(([sessionId, session]) => {
            if (session.ws === ws) {
                // Fire-and-forget cleanup - don't await
                this.cleanUpSession(sessionId).catch(err =>
                    console.error(`Cleanup error for session ${sessionId}:`, err)
                );
            }
        });

        // Close immediately without waiting for cleanup
        ws.close();
    }

    private handleMessage = (data: any, sessionId: string) => {
        let parsedData;
        const session = this.sessions.get(sessionId);
        if (!session) return

        try {


            if (typeof data !== "string") {
                parsedData = JSON.parse(data.toString())
            } else {
                parsedData = JSON.parse(data); // {type: "join-room", roomId: 1}
            }

        } catch (err) {
            console.error("Invalid JSON received:", data, err);
            return;

        }
        if (parsedData.type !== "mouseMovement") {
            console.log('handlemessage" ', parsedData)

        }


        switch (parsedData.type) {
            case 'join_room':
                handleJoinRoom(session, parsedData, this.sessions)
                break;
            case 'leave_room':
                removeUserFromRoom(session.sessionId, this.sessions);
                session.roomId = null;
                break;
            case 'chat':
                handleChat(session, this.sessions, parsedData)
                break;
            case 'mouseMovement':
                handleMouseMovement(session, this.sessions, parsedData)
                break;
            case 'shapeUpdate':
                handleShapeUpdate(session, this.sessions, parsedData)
                break;
            case 'shapeDelete':
                handleShapeDelete(session, this.sessions, parsedData)
                break;
            case 'shapePreview':
                handleShapePreview(session, this.sessions, parsedData)
                break;
            case 'scene-init':
                handleSceneInit(session, this.sessions, parsedData)
                break;

            default:
                break;
        }
    }

}