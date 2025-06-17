import { redis } from '@repo/backend-common/config';
import { prisma } from '@repo/db/client';

export async function startWorker() {

    while (true) {

        try {
            console.log('Worker started and waiting for items')

            const msg = await redis.brpop("messageQueue", 0);   // TODO--> use adv queues like bullmq for acknowledgement

            if (!msg) continue
            const [key, messageData,] = msg;
            const parsedMessage = JSON.parse(messageData)
            console.log('item poped from the queue --> ', parsedMessage);

            switch (parsedMessage.type) {
                case 'chat':
                    await handleChatCreation(parsedMessage);
                    break;

                case 'shapeUpdate':
                    await handleShapeUpdateDb(parsedMessage);
                    break;

                default:
                    console.warn(`Unknown message type: ${parsedMessage.type}`);
                    return;
            }


        } catch (error) {
            console.error("Error processing message:", error);
            await new Promise(resolve => setTimeout(resolve, 5000));


        }

    }
}

async function handleChatCreation(parsedMessage:parsedMessage ) {
    await prisma.chat.create({
        data: {
            userId: parsedMessage.userId,
            roomId: parsedMessage.roomId,
            data: parsedMessage.message,
            type: parsedMessage.shapeType,
            shapeId: parsedMessage.shapeId
        }

    })


}

async function handleShapeUpdateDb(parsedMessage:parsedMessage) {
    await prisma.chat.update({
        where: {
            shapeId: parsedMessage.shapeId
        },
        data: {
            data: parsedMessage.message
        }
    })
}

export interface parsedMessage {
    type:'chat' | 'shapeUpdate';
    userId : string;
    roomId:string;
    shapeId:string;
    message:any;                                          //need to fix - error prisma.JsonValue not working 
    shapeType: 'rect' | 'ellipse' | 'pencil' | 'text' | 'diamond'
    
}