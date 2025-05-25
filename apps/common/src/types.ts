import z from 'zod';

export const CreateUserSchema = z.object({
    username:z.string(),
    password:z.string().min(6),
    name:z.string()
})
export const signInSchema = z.object({
    username:z.string(),
    password:z.string().min(6)
})

export const CreateRoomSchema = z.object({
    roomName : z.string()
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type SigiInInput = z.infer<typeof signInSchema>;
export type CreateRoomSchema = z.infer<typeof CreateRoomSchema>