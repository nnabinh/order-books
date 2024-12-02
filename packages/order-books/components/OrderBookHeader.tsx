import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface OrderBookHeaderProps {
  precision: number;
  changePrecision: (value: number) => void;
}

const MAX_PRECISION = 4;
const MIN_PRECISION = 0;

export const OrderBookHeader: React.FC<OrderBookHeaderProps> = ({
  precision,
  changePrecision,
}) => {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.header}>ORDER BOOK</Text>
      <View style={styles.precisionControls}>
        <TouchableOpacity
          onPress={() =>
            changePrecision(Math.min(MAX_PRECISION, precision + 1))
          }
          style={[
            styles.precisionButton,
            precision >= MAX_PRECISION && styles.precisionButtonDisabled,
          ]}
          disabled={precision >= MAX_PRECISION}
        >
          <Text style={styles.precisionButtonText}>-</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            changePrecision(Math.max(MIN_PRECISION, precision - 1))
          }
          style={[
            styles.precisionButton,
            precision <= MIN_PRECISION && styles.precisionButtonDisabled,
          ]}
          disabled={precision <= MIN_PRECISION}
        >
          <Text style={styles.precisionButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 10,
    marginBottom: 10,
  },
  header: {
    fontSize: 24,
    color: "white",
  },
  precisionControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  precisionButton: {
    padding: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  precisionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  precisionText: {
    color: "white",
    fontSize: 16,
    marginHorizontal: 8,
  },
  precisionButtonDisabled: {
    backgroundColor: "#2a2a2a",
    opacity: 0.5,
  },
});
