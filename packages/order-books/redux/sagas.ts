import { eventChannel, EventChannel } from "redux-saga";
import { call, put, takeEvery, cancel, fork, take } from "redux-saga/effects";
import { setConnectionStatus, setOrderBook } from "./slice";
import { BITFINEX_WS_URL } from "../utils/constants";

let socket: WebSocket | null = null; // We keep the WebSocket instance in a variable

// Function to create a new WebSocket connection
function createWebSocket() {
  return new WebSocket(BITFINEX_WS_URL);
}

function createWebSocketChannel(socket: WebSocket) {
  return eventChannel((emit) => {
    socket.onopen = () => {
      emit({ type: "open" });
    };

    socket.onmessage = (event) => {
      emit({ type: "message", payload: JSON.parse(event.data) });
    };

    socket.onclose = () => {
      emit({ type: "close" });
    };

    socket.onerror = (error) => {
      emit({ type: "error", error });
    };

    return () => {
      socket.close();
    };
  });
}

// Function to create subscription message with precision
function createSubscriptionMessage(precision: number) {
  return JSON.stringify({
    event: "subscribe",
    channel: "book",
    symbol: "tBTCUSD",
    prec: `P${precision}`,
    // freq: "F1",
  });
}

// Update subscribeToOrderBook to accept precision
function* subscribeToOrderBook(precision: number): Generator {
  try {
    // Reset bids and asks at the start of each subscription
    const bids = new Map();
    const asks = new Map();

    socket = createWebSocket();
    let channelId: string | null = null;

    if (!socket) {
      throw new Error("Failed to create WebSocket");
    }

    const channel = (yield call(
      createWebSocketChannel,
      socket
    )) as EventChannel<any>;

    const msg = createSubscriptionMessage(precision);

    while (true) {
      const event: any = yield take(channel);

      switch (event.type) {
        case "open":
          socket?.send(msg);
          yield put(setConnectionStatus(true));
          break;

        case "message":
          const message = event.payload;
          if (message.event === "subscribed" || message.channel === "book") {
            channelId = message.chanId;
          }

          if (
            message instanceof Array &&
            channelId &&
            message[0] === channelId
          ) {
            const data = message[1];
            // Skip heartbeat messages
            if (data === "hb") return;

            // Process order book data
            const [price, count, amount] = data;

            if (count > 0) {
              // Price level exists
              if (amount > 0) {
                // Positive amount = bid
                bids.set(price, { price, count, amount });
                asks.delete(price); // Remove from asks if it existed there
              } else {
                // Negative amount = ask
                asks.set(price, { price, count, amount: -amount }); // Store positive amount for asks
                bids.delete(price); // Remove from bids if it existed there
              }
            } else {
              // Count = 0 means remove this price level completely
              bids.delete(price);
              asks.delete(price);
            }

            // Update Redux state with the new order book data
            yield put(
              setOrderBook({
                bids: Array.from(bids.values()),
                asks: Array.from(asks.values()),
              })
            );
          }
          break;

        case "close":
          yield put(setConnectionStatus(false));
          socket = null;
          break;

        case "error":
          yield put(setConnectionStatus(false));
          socket = null;
          break;
      }
    }
  } catch (error) {
    yield put(setConnectionStatus(false));
    socket = null;
  }
}

// Saga to cancel WebSocket task when disconnecting
function* cancelConnection(): Generator {
  if (socket) {
    socket.close(); // Properly close the WebSocket
    socket = null;
  }
  yield put(setConnectionStatus(false));
}

// Update watchWebSocket to handle precision
function* watchWebSocket(): Generator {
  while (true) {
    const action = (yield take([
      "webSocket/connect",
      "webSocket/disconnect",
      "webSocket/changePrecision",
    ])) as { type: string; payload?: number };

    if (action.type === "webSocket/disconnect") {
      yield call(cancelConnection);
      continue;
    }

    if (socket) {
      yield call(cancelConnection);
    }

    const precision = action.payload ?? 0;
    yield fork(subscribeToOrderBook, precision);
  }
}

export { watchWebSocket };
