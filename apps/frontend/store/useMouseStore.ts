import { create } from 'zustand';

type MouseData = {
  [userId: string]: { x: number; y: number }; 
};

type MouseStore = {
  mousePositions: MouseData;
  setMousePosition: (userId: string, x: number, y: number) => void;
};

export const useMouseStore = create<MouseStore>((set) => ({
  mousePositions: {},
  setMousePosition: (userId, x, y) =>
    set((state) => ({
      mousePositions: {
        ...state.mousePositions,
        [userId]: { x, y },
      },
    })),
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