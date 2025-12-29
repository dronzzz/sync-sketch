import { create } from 'zustand';

interface User {
    sessionId: string;
    username: string;
}

interface RoomStore {
    users: User[];
    setUsers: (users: User[]) => void;
    removeUser: (sessionId: string) => void;
    clearUsers: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
    users: [],
    setUsers: (users) => set({ users }),
    removeUser: (sessionId) => set((state) => ({
        users: state.users.filter(u => u.sessionId !== sessionId)
    })),
    clearUsers: () => set({ users: [] }),
}));
