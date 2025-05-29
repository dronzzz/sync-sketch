import { WebSocketServer, WebSocket } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '@repo/backend-common/config';
import { prisma } from '@repo/db/client';

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket,
  rooms: string[],
  userId: string
}

const users: User[] = [];
const checkUser = (token: string): string | null => {

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded == "string") {
      return null
    }
    if (!decoded || !decoded.userId) {
      return null;
    }
    return decoded.userId;
  } catch (error) {
    return null;
  }
  return null;
}


wss.on('connection', function connection(ws, request) {

  const url = request.url;
  if (!url) {
    return
  }

  const queryParam = new URLSearchParams(url.split("?")[1]);
  const token = queryParam.get('token') || "";

  const userId = checkUser(token);
  if (userId == null) {
    ws.close();
    return;
  }

  users.push({
    userId,
    rooms: [],
    ws
  })

  ws.on('error', console.error);

  ws.on('message', async function message(data) {
    let parsedData;


    if (typeof data !== "string") {
      parsedData = JSON.parse(data.toString())
    } else {
      parsedData = JSON.parse(data); // {type: "join-room", roomId: 1}
    }
    console.log('parsed data',parsedData)
    if (parsedData.type === "join_room") {
      console.log('users list ',users)

      const user = users.find(x => x.ws === ws);
      user?.rooms.push(parsedData.roomId)

    }
    if (parsedData.type === "leave_room") {
      const user = users.find(x => x.ws === ws);
      if (!user) {
        return null;
      }
      user.rooms = user?.rooms.filter(x => x == parsedData.roomId)
    }


    if (parsedData.type === "chat") {
      console.log(users)
      console.log(parsedData)
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      users.forEach(user => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(JSON.stringify({
            type: "chat",
            message,
            roomId
          }))

        }
      })

      // const datasaved = await prisma.chat.create({
      //   data:{
      //     roomId,
      //     message,
      //     userId
      //   }
      // })
      // console.log('saved data')


    }
  });


});