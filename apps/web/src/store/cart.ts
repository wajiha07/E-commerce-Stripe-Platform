import { create } from 'zustand';

type CartState = {
  open: boolean;
  itemCount: number;
  setOpen: (open: boolean) => void;
  setItemCount: (n: number) => void;
};

export const useCartUi = create<CartState>((set) => ({
  open: false,
  itemCount: 0,
  setOpen: (open) => set({ open }),
  setItemCount: (itemCount) => set({ itemCount }),
}));
