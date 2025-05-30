import {z }from 'zod';

export const CreateUserSchema = z.object({
    email:z.string(),
    password:z.string().min(6),
    name:z.string()
})
export const signInSchema = z.object({
    email:z.string(),
    password:z.string().min(6)
})

export const CreateRoomSchema = z.object({
    slug : z.string(),
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateRoomInput = z.infer<typeof CreateRoomSchema>