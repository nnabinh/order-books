import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type OrderBookEntry = {
  price: number;
  count: number;
  amount: number;
};

interface OrderBookState {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  isConnected: boolean;
}

const initialState: OrderBookState = {
  bids: [],
  asks: [],
  isConnected: false,
};

const orderBookSlice = createSlice({
  name: "orderBook",
  initialState,
  reducers: {
    setOrderBook: (
      state,
      action: PayloadAction<{ bids: OrderBookEntry[]; asks: OrderBookEntry[] }>
    ) => {
      state.bids = action.payload.bids;
      state.asks = action.payload.asks;
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
  },
});

export const { setOrderBook, setConnectionStatus } = orderBookSlice.actions;
export const orderBookReducer = orderBookSlice.reducer;
