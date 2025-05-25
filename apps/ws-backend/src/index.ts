import { WebSocketServer } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '@repo/backend-common/config';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws,request) {

  const url = request.url;
  if(!url){
    return
  }

  const queryParam = new URLSearchParams(url.split("?")[1]);
  const token = queryParam.get('token') || "";

  const decoded = jwt.verify(token,JWT_SECRET);
  if(!decoded || (decoded as JwtPayload).userId){
    ws.close();
    return
  }

  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('connectin established');
});