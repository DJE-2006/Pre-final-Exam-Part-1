import React, { memo, useCallback, useRef, useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const PALETTE = {
  bg: '#080813',
  card: '#111124',
  cardBorder: '#1e1e40',
  cellDefault: '#16162e',
  cellBorder: '#252545',
  selected: '#7c3aed',
  neighbor: '#2563eb',
  text: '#f1f5f9',
  textSub: '#94a3b8',
  textMuted: '#64748b',
  accent: '#a78bfa',
  btnBg: '#6d28d9',
  inputBg: '#0e0e22',
  inputBorder: '#2a2a50',
  inputFocusBorder: '#7c3aed',
  divider: '#1e1e3a',
  error: '#ef4444',
  errorText: '#f87171',
  chipBg: 'rgba(37, 99, 235, 0.18)',
  chipBorder: 'rgba(37, 99, 235, 0.45)',
  chipText: '#93c5fd',
};

function getCellSize(gridSize: number): number {
  if (gridSize <= 8) return 40;
  if (gridSize <= 12) return 32;
  if (gridSize <= 15) return 26;
  return 22;
}

function getCellFontSize(cellSize: number): number {
  if (cellSize >= 36) return 12;
  if (cellSize >= 28) return 10;
  return 8;
}

interface GridCellProps {
  index: number;
  isSelected: boolean;
  isNeighbor: boolean;
  onPress: (i: number) => void;
  cellSize: number;
}

const GridCell = memo(function GridCell({
  index,
  isSelected,
  isNeighbor,
  onPress,
  cellSize,
}: GridCellProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.85,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 10,
    }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress(index);
  }, [index, onPress]);

  const fontSize = getCellFontSize(cellSize);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.cell,
          { width: cellSize, height: cellSize, transform: [{ scale }] },
          isSelected && styles.cellSelected,
          isNeighbor && styles.cellNeighbor,
        ]}
      >
        <Text
          style={[
            styles.cellText,
            { fontSize },
            (isSelected || isNeighbor) && styles.cellTextActive,
          ]}
          numberOfLines={1}
        >
          {String(index).padStart(2, '0')}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

export default function HomeScreen() {
  const [gridSize, setGridSize] = useState(10);
  const [inputValue, setInputValue] = useState('10');
  const [selected, setSelected] = useState<number | null>(null);
  const [neighbors, setNeighbors] = useState<number[]>([]);
  const [inputFocused, setInputFocused] = useState(false);
  const [error, setError] = useState('');

  const getNeighbors = useCallback((index: number, size: number): number[] => {
    const row = Math.floor(index / size);
    const col = index % size;
    const result: number[] = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
          result.push(newRow * size + newCol);
        }
      }
    }

    return result.sort((a, b) => a - b);
  }, []);

  const handleCellPress = useCallback(
    (index: number) => {
      setSelected(index);
      setNeighbors(getNeighbors(index, gridSize));
    },
    [gridSize, getNeighbors],
  );

  const handleRegenerate = useCallback(() => {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 20) {
      setError('Enter a number between 1 and 20');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    setError('');
    setGridSize(parsed);
    setSelected(null);
    setNeighbors([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [inputValue]);

  const totalCells = gridSize * gridSize;
  const cellSize = getCellSize(gridSize);
  const gridWidth = gridSize * cellSize + (gridSize - 1) * 3;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Number Grid</Text>
              <Text style={styles.subtitle}>Tap a cell to highlight neighbors</Text>
            </View>
            <View style={styles.sizeBadge}>
              <Text style={styles.sizeBadgeText}>{gridSize} × {gridSize}</Text>
            </View>
          </View>

          <View style={styles.gridCard}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gridScrollContent}
            >
              <View style={[styles.grid, { width: gridWidth }]}>
                {Array.from({ length: totalCells }, (_, i) => (
                  <GridCell
                    key={i}
                    index={i}
                    isSelected={selected === i}
                    isNeighbor={neighbors.includes(i)}
                    onPress={handleCellPress}
                    cellSize={cellSize}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          {selected !== null ? (
            <View style={styles.resultCard}>
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeLabel}>SELECTED</Text>
                <Text style={styles.resultBadgeValue}>
                  {String(selected).padStart(2, '0')}
                </Text>
              </View>
              <View style={styles.resultDividerV} />
              <View style={styles.resultNeighborSection}>
                <Text style={styles.resultNeighborLabel}>
                  NEIGHBORS · {neighbors.length}
                </Text>
                <View style={styles.neighborChips}>
                  {neighbors.map((n) => (
                    <View key={n} style={styles.chip}>
                      <Text style={styles.chipText}>
                        {String(n).padStart(2, '0')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.hintCard}>
              <Text style={styles.hintText}>Select any cell to begin</Text>
            </View>
          )}

          <View style={styles.controls}>
            <Text style={styles.label}>GRID SIZE  ·  1 to 20</Text>
            <TextInput
              style={[
                styles.input,
                inputFocused && styles.inputFocused,
                !!error && styles.inputError,
              ]}
              value={inputValue}
              onChangeText={(v) => {
                setInputValue(v);
                if (error) setError('');
              }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              keyboardType="numeric"
              textAlign="center"
              placeholderTextColor={PALETTE.textMuted}
              selectionColor={PALETTE.accent}
              maxLength={2}
            />
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleRegenerate}
            >
              <Text style={styles.buttonText}>Regenerate Grid</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.bg,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: PALETTE.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: PALETTE.textSub,
    marginTop: 4,
  },
  sizeBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sizeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.accent,
    letterSpacing: 0.5,
  },
  gridCard: {
    backgroundColor: PALETTE.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    padding: 14,
  },
  gridScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  cell: {
    borderRadius: 6,
    backgroundColor: PALETTE.cellDefault,
    borderWidth: 1,
    borderColor: PALETTE.cellBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellSelected: {
    backgroundColor: PALETTE.selected,
    borderColor: PALETTE.selected,
    shadowColor: PALETTE.selected,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 10,
  },
  cellNeighbor: {
    backgroundColor: PALETTE.neighbor,
    borderColor: PALETTE.neighbor,
    shadowColor: PALETTE.neighbor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 6,
  },
  cellText: {
    color: PALETTE.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  cellTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: PALETTE.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  resultBadge: {
    alignItems: 'center',
    minWidth: 72,
  },
  resultBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: PALETTE.textMuted,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  resultBadgeValue: {
    fontSize: 34,
    fontWeight: '800',
    color: PALETTE.accent,
    letterSpacing: -1,
  },
  resultDividerV: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: PALETTE.divider,
  },
  resultNeighborSection: {
    flex: 1,
  },
  resultNeighborLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: PALETTE.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  neighborChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: PALETTE.chipBg,
    borderWidth: 1,
    borderColor: PALETTE.chipBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.chipText,
    letterSpacing: 0.5,
  },
  hintCard: {
    backgroundColor: PALETTE.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    paddingVertical: 22,
    alignItems: 'center',
  },
  hintText: {
    color: PALETTE.textSub,
    fontSize: 14,
  },
  controls: {
    gap: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textSub,
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: PALETTE.inputBg,
    borderWidth: 1.5,
    borderColor: PALETTE.inputBorder,
    borderRadius: 12,
    height: 54,
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.text,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: PALETTE.inputFocusBorder,
    shadowColor: PALETTE.inputFocusBorder,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderColor: PALETTE.error,
  },
  errorText: {
    color: PALETTE.errorText,
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    backgroundColor: PALETTE.btnBg,
    borderRadius: 12,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PALETTE.btnBg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 4,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
