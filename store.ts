import { configureStore } from "@reduxjs/toolkit";
import { orderBookReducer } from "@/packages/order-books/redux/slice";
import createSagaMiddleware from "redux-saga";
import { watchWebSocket } from "@/packages/order-books/redux/sagas";

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    orderBook: orderBookReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sagaMiddleware),
});

sagaMiddleware.run(watchWebSocket);

export type RootState = ReturnType<typeof store.getState>;
