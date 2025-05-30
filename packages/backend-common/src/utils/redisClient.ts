
import {Redis} from "ioredis"
import dotenv from 'dotenv';
dotenv.config();

export class RedisClient {

    private static instance: Redis;
    

    public static getInstance():Redis {
        if (!process.env.REDIS_URL) {
            throw new Error("REDIS_URL environment variable is not defined.");
        }
        
        if (!RedisClient.instance) {
            RedisClient.instance = new Redis(process.env.REDIS_URL);
        }
        return RedisClient.instance;

    }
    public static async closeConnection(): Promise<void> {
        if (RedisClient.instance) {
            await RedisClient.instance.quit();
        }
    }
}