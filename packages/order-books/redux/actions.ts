export const connectWebSocket = () => ({ type: "webSocket/connect" });

export const disconnectWebSocket = () => ({ type: "webSocket/disconnect" });

export const changePrecision = (precision: number) => ({
  type: "webSocket/changePrecision",
  payload: precision,
});
