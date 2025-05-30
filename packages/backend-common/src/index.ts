import { RedisClient } from "./utils/redisClient.js";


export const redis = RedisClient.getInstance();


export const JWT_SECRET = process.env.JWT_SECRET ||"YGKJNLBIUNCNHDSUCDSKCDSc";
export const REDIS_URL = process.env.REDIS_URL;
