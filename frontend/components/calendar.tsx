import { View, Text, Pressable, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState, useEffect } from "react";
import { Evento } from "@/lib/store";

interface CalendarProps {
  eventos: Evento[];
  onDateSelect?: (data: string) => void;
  selectedDate?: string;
}

export function Calendar({ eventos, onDateSelect, selectedDate }: CalendarProps) {
  const colors = useColors();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [daysWithEvents, setDaysWithEvents] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Calcular quais dias têm eventos neste mês
    const ano = currentMonth.getFullYear();
    const mes = currentMonth.getMonth() + 1;
    const mesFormatado = String(mes).padStart(2, "0");
    const anoFormatado = String(ano);

    const dias = new Set<number>();
    eventos.forEach((evento) => {
      if (evento.data.startsWith(`${anoFormatado}-${mesFormatado}`)) {
        const dia = parseInt(evento.data.split("-")[2]);
        dias.add(dia);
      }
    });
    setDaysWithEvents(dias);
  }, [currentMonth, eventos]);

  // Recarregar quando eventos mudam
  useEffect(() => {
    const ano = currentMonth.getFullYear();
    const mes = currentMonth.getMonth() + 1;
    const mesFormatado = String(mes).padStart(2, "0");
    const anoFormatado = String(ano);

    const dias = new Set<number>();
    eventos.forEach((evento) => {
      if (evento.data.startsWith(`${anoFormatado}-${mesFormatado}`)) {
        const dia = parseInt(evento.data.split("-")[2]);
        dias.add(dia);
      }
    });
    setDaysWithEvents(dias);
  }, [eventos]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDayPress = (dia: number) => {
    const data = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    onDateSelect?.(data);
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days: (number | null)[] = [];

  // Dias vazios do mês anterior
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Dias do mês
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const isSelected = (dia: number) => {
    if (!selectedDate) return false;
    const [ano, mes, d] = selectedDate.split("-");
    return (
      parseInt(ano) === currentMonth.getFullYear() &&
      parseInt(mes) === currentMonth.getMonth() + 1 &&
      parseInt(d) === dia
    );
  };

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Pressable onPress={handlePrevMonth} style={{ padding: 8 }}>
          <MaterialIcons name="chevron-left" size={24} color={colors.primary} />
        </Pressable>

        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, textAlign: "center", flex: 1 }}>
          {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
        </Text>

        <Pressable onPress={handleNextMonth} style={{ padding: 8 }}>
          <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Days of week header */}
      <View style={{ flexDirection: "row", marginBottom: 8 }}>
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
          <Text
            key={day}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 12,
              fontWeight: "600",
              color: colors.muted,
              paddingVertical: 8,
            }}
          >
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View>
        {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => (
          <View key={weekIndex} style={{ flexDirection: "row", marginBottom: 4 }}>
            {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((dia, dayIndex) => {
              const hasEvent = dia && daysWithEvents.has(dia);
              const selected = dia && isSelected(dia);

              return (
                <Pressable
                  key={dayIndex}
                  onPress={() => dia && handleDayPress(dia)}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 8,
                    backgroundColor: selected ? colors.primary : "transparent",
                    borderWidth: hasEvent ? 2 : 0,
                    borderColor: colors.primary,
                    marginHorizontal: 2,
                    minHeight: 40,
                    maxHeight: 50,
                  }}
                >
                  {dia ? (
                    <>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: selected ? "#FFF" : colors.foreground,
                        }}
                      >
                        {dia}
                      </Text>
                      {hasEvent && !selected && (
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: colors.primary,
                            marginTop: 2,
                          }}
                        />
                      )}
                    </>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
