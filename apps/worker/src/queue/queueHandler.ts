import {redis} from '@repo/backend-common/config';
import {prisma} from '@repo/db/client';

export async function startWorker () {

    while(true){

        try {
            console.log('Worker started and waiting for items')             
             
            const msg = await redis.brpop("messageQueue",0);   // TODO--> use adv queues like bullmq for acknowledgement
            
            if(!msg)continue
            const [key,messageData,] = msg;
            const parsedMessage = JSON.parse(messageData)
            console.log('item poped from the queue --> ',parsedMessage);

            await prisma.chat.create({
                data:{
                    userId: parsedMessage.userId,
                    roomId: parsedMessage.roomId,
                    message :parsedMessage.message
                }

            })
            
        } catch (error) {
            console.error("Error processing message:", error);
            await new Promise(resolve => setTimeout(resolve, 5000));

            
        }

    }
}

