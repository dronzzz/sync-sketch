import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
export function generateSlug(digits: number = 10) {
    const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
    let slug = "";
    for (let i = 0; i < digits; i++) {
        slug += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return slug;
}
