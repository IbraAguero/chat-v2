import { create } from "zustand";

interface ChatState {
  currentFlow: string;
  userResponses: Record<string, any>;
  messages: { from: "bot" | "user"; text: string }[];
  setFlow: (flow: string) => void;
  addResponse: (key: string, value: any) => void;
  addMessage: (message: { from: "bot" | "user"; text: string }) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  currentFlow: "bienvenida",
  messages: [],
  userResponses: {},

  setFlow: (flow) => set({ currentFlow: flow }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  addResponse: (key, value) =>
    set((state) => ({
      userResponses: { ...state.userResponses, [key]: value },
    })),
}));
