import { create } from 'zustand';

export interface TransferItem {
  id: string; // Unique ID (e.g. timestamp or cod_art_origen_destino)
  cod_sucursal_origen: number;
  sucursal_origen: string;
  cod_sucursal_destino: number;
  sucursal_destino: string;
  cod_art: string;
  descripcion: string;
  cantidad: number;
  fecha_vencimiento: string; // To discount the correct batch if needed, or we just discount the oldest? We need fecha_vencimiento for the transfer detail.
}

interface TransferStore {
  items: TransferItem[];
  addItem: (item: TransferItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useTransferStore = create<TransferStore>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
  clearCart: () => set({ items: [] }),
}));
