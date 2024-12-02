import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  connectWebSocket,
  disconnectWebSocket,
  changePrecision as changePrecisionAction,
} from "@/packages/order-books/redux/actions";
import { RootState } from "@/store";
import { OrderBookEntry, setOrderBook } from "../redux/slice";
import { formatNumber } from "../utils/formatNumber";
import { OrderBookHeader } from "./OrderBookHeader";

const MAX_NUMBER_OF_ROWS = 10;
const LOADING_TIMEOUT = 3000;
const ERROR_TIMEOUT = 15000;
const SPARE_TIMEOUT_FOR_RECONNECT = 1000;
const PRICE_DECIMALS = 3;
const AMOUNT_DECIMALS = 3;

const calculateCumulativeData = (entries: OrderBookEntry[], index: number) => {
  const visibleEntries = entries.slice(0, MAX_NUMBER_OF_ROWS);
  const cumulativeAmount = visibleEntries
    .slice(0, index + 1)
    .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
  const maxAmount = visibleEntries.reduce(
    (sum, entry) => sum + Math.abs(entry.amount),
    0
  );
  const barWidth = (cumulativeAmount / maxAmount) * 100;

  return { cumulativeAmount, barWidth };
};

const OrderBook: React.FC = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [precision, setPrecision] = useState(0);
  const { bids, asks } = useSelector((state: RootState) => state.orderBook);

  // Check if we have any data
  const hasData = bids.length > 0 || asks.length > 0;

  // Handle initial loading and error states
  useEffect(() => {
    let loadingTimer: NodeJS.Timeout;
    let errorTimer: NodeJS.Timeout;

    if (!hasData) {
      loadingTimer = setTimeout(() => {
        if (!hasData) {
          errorTimer = setTimeout(() => {
            if (!hasData) {
              setHasError(true);
              dispatch(disconnectWebSocket());
            }
          }, ERROR_TIMEOUT);
        }
      }, LOADING_TIMEOUT);
    } else {
      setIsLoading(false);
      setHasError(false);
    }

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(errorTimer);
    };
  }, [hasData, dispatch]);

  const handleReconnect = () => {
    setIsLoading(true);
    setHasError(false);
    dispatch(changePrecisionAction(precision));
  };

  useEffect(() => {
    dispatch(connectWebSocket());
  }, []);

  const changePrecision = (value: number) => {
    setPrecision(value);
    setIsLoading(true);
    dispatch(disconnectWebSocket());
    setTimeout(() => {
      dispatch(setOrderBook({ bids: [], asks: [] }));
      setTimeout(() => {
        dispatch(changePrecisionAction(value));
      }, SPARE_TIMEOUT_FOR_RECONNECT);
    }, SPARE_TIMEOUT_FOR_RECONNECT);
  };

  const renderOrderBookItem = (
    item: OrderBookEntry,
    index: number,
    type: "bid" | "ask"
  ) => {
    const { cumulativeAmount, barWidth } = calculateCumulativeData(
      type === "bid" ? bids : asks,
      index
    );

    const leftValue = type === "bid" ? cumulativeAmount : item.price;
    const rightValue = type === "bid" ? item.price : cumulativeAmount;

    return (
      <View style={styles.row}>
        <Text style={[styles.text, styles.leftAlign]}>
          {formatNumber(
            leftValue,
            type === "bid" ? AMOUNT_DECIMALS : PRICE_DECIMALS
          )}
        </Text>
        <Text style={[styles.text, styles.rightAlign]}>
          {formatNumber(
            rightValue,
            type === "bid" ? PRICE_DECIMALS : AMOUNT_DECIMALS
          )}
        </Text>
        <View
          style={[
            styles.depthBar,
            type === "bid" ? styles.bidBar : styles.askBar,
            {
              width: `${barWidth}%`,
              position: "absolute",
              [type === "bid" ? "right" : "left"]: 0,
            },
          ]}
        />
      </View>
    );
  };

  const renderBidItem = (item: OrderBookEntry, index: number) =>
    renderOrderBookItem(item, index, "bid");

  const renderAskItem = (item: OrderBookEntry, index: number) =>
    renderOrderBookItem(item, index, "ask");

  return (
    <View style={styles.container}>
      <OrderBookHeader
        precision={precision}
        changePrecision={changePrecision}
      />

      {hasError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Connection failed</Text>
          <TouchableOpacity
            style={styles.reconnectButton}
            onPress={handleReconnect}
          >
            <Text style={styles.reconnectButtonText}>Reconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.orderBook}>
          <View style={styles.column}>
            <View style={styles.columnHeaders}>
              <Text style={styles.headerText}>TOTAL</Text>
              <Text style={styles.headerText}>PRICE</Text>
            </View>
            {isLoading || !hasData ? null : (
              <FlatList
                scrollEnabled={false}
                data={bids.slice(0, MAX_NUMBER_OF_ROWS)}
                renderItem={({ item, index }) => renderBidItem(item, index)}
                keyExtractor={(_, index) => `bid-${index}`}
              />
            )}
          </View>

          {isLoading || !hasData ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : null}

          <View style={styles.column}>
            <View style={styles.columnHeaders}>
              <Text style={styles.headerText}>PRICE</Text>
              <Text style={styles.headerText}>TOTAL</Text>
            </View>
            {isLoading || !hasData ? null : (
              <FlatList
                scrollEnabled={false}
                data={asks.slice(0, MAX_NUMBER_OF_ROWS)}
                renderItem={({ item, index }) => renderAskItem(item, index)}
                keyExtractor={(_, index) => `ask-${index}`}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#333",
  },
  orderBook: {
    flexDirection: "row",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderColor: "#444",
    position: "relative",
    height: 30,
  },
  text: {
    color: "white",
    zIndex: 1,
  },
  leftAlign: {
    textAlign: "left",
    flex: 1,
    paddingLeft: 10,
  },
  rightAlign: {
    textAlign: "right",
    flex: 1,
    paddingRight: 10,
  },
  depthBar: {
    height: 30,
    opacity: 0.2,
  },
  column: {
    flex: 1,
  },
  columnHeaders: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#444",
  },
  headerText: {
    color: "#666",
    fontSize: 12,
    marginHorizontal: 10,
  },
  bidBar: {
    backgroundColor: "rgb(0, 255, 0)",
  },
  askBar: {
    backgroundColor: "rgb(255, 0, 0)",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    padding: 20,
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 10,
  },
  reconnectButton: {
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 5,
  },
  reconnectButtonText: {
    color: "white",
    fontSize: 14,
  },
  loadingContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 120,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});

export default OrderBook;
