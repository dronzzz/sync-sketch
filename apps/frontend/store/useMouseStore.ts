import { create } from 'zustand';

type MouseData = {
  [userId: string]: { x: number; y: number, username: string; };
};

type MouseStore = {
  mousePositions: MouseData;
  setMousePosition: (userId: string, x: number, y: number, username: string) => void;
  removeUser: (userId: string) => void;
};

export const useMouseStore = create<MouseStore>((set) => ({
  mousePositions: {},

  setMousePosition: (userId, x, y, username) =>
    set((state) => ({
      mousePositions: {
        ...state.mousePositions,
        [userId]: { x, y, username },
      },
    })),

  removeUser: (userId) =>
    set((state) => {
      const { [userId]: _, ...rest } = state.mousePositions;
      return { mousePositions: rest };
    }),
}));

type CursorType ={
  cursorType : string;
  setCursorType : (cursor : string ) => void;
}



export const useCursorType = create<CursorType>((set) => ({
  cursorType: '',

  setCursorType: (cursor) =>
    set(() => ({
      cursorType: cursor,
    })),
}));