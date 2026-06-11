import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { obterFluxoDeCaixaMes, adicionarFluxoDeCaixa, calcularSaldoFluxoDeCaixa } from "@/lib/financeiro-store";
import { FluxoDeCaixa } from "@/lib/financeiro-types";

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function FluxoDeCaixaScreen() {
  const colors = useColors();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [fluxos, setFluxos] = useState<FluxoDeCaixa[]>([]);
  const [saldoTotal, setSaldoTotal] = useState(0);
  const [showAdicionar, setShowAdicionar] = useState(false);
  const [novoFluxo, setNovoFluxo] = useState({
    entradas: "",
    saidas: "",
  });

  useEffect(() => {
    carregarFluxos();
  }, [mes, ano]);

  async function carregarFluxos() {
    const dados = await obterFluxoDeCaixaMes(mes, ano);
    setFluxos(dados);
    const saldo = await calcularSaldoFluxoDeCaixa(mes, ano);
    setSaldoTotal(saldo);
  }

  async function adicionarNovoFluxo() {
    if (!novoFluxo.entradas && !novoFluxo.saidas) return;

    const entradas = parseFloat(novoFluxo.entradas) || 0;
    const saidas = parseFloat(novoFluxo.saidas) || 0;
    const saldoAnterior = fluxos.length > 0 ? fluxos[fluxos.length - 1].saldoDia : 0;
    const saldoDia = saldoAnterior + entradas - saidas;

    await adicionarFluxoDeCaixa({
      data: new Date().toISOString().split("T")[0],
      saldoAnterior,
      entradas,
      saidas,
      saldoDia,
      separacao: {
        dinheiroDaEmpresa: saldoDia * 0.5,
        proLabore: saldoDia * 0.2,
        lucro: saldoDia * 0.15,
        reservaFinanceira: saldoDia * 0.1,
        impostos: saldoDia * 0.05,
      },
    });

    setNovoFluxo({ entradas: "", saidas: "" });
    setShowAdicionar(false);
    carregarFluxos();
  }

  const inputStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.foreground,
    fontSize: 14,
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold" }}>Fluxo de Caixa</Text>
          <Pressable onPress={() => setShowAdicionar(!showAdicionar)}>
            <MaterialIcons name="add-circle" size={32} color={colors.primary} />
          </Pressable>
        </View>

        {/* Seletor de Mês/Ano */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <Pressable
            onPress={() => setMes(mes === 1 ? 12 : mes - 1)}
            style={{ backgroundColor: colors.surface, padding: 8, borderRadius: 8 }}
          >
            <MaterialIcons name="chevron-left" size={24} color={colors.primary} />
          </Pressable>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 8, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
              {meses[mes - 1]} {ano}
            </Text>
          </View>
          <Pressable
            onPress={() => setMes(mes === 12 ? 1 : mes + 1)}
            style={{ backgroundColor: colors.surface, padding: 8, borderRadius: 8 }}
          >
            <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
          </Pressable>
        </View>

        {/* Saldo Total */}
        <View
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 12, opacity: 0.8 }}>SALDO TOTAL</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 32, fontWeight: "bold", marginTop: 4 }}>
            R$ {saldoTotal.toFixed(2)}
          </Text>
        </View>

        {/* Formulário de Adição */}
        {showAdicionar && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>Adicionar Movimento</Text>
            <TextInput
              placeholder="Entradas (R$)"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={novoFluxo.entradas}
              onChangeText={(t) => setNovoFluxo({ ...novoFluxo, entradas: t })}
              style={{ ...inputStyle, marginBottom: 8 } as any}
            />
            <TextInput
              placeholder="Saídas (R$)"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={novoFluxo.saidas}
              onChangeText={(t) => setNovoFluxo({ ...novoFluxo, saidas: t })}
              style={{ ...inputStyle, marginBottom: 12 } as any}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setShowAdicionar(false)}
                style={({ pressed }) => [{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 10,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                }]}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={adicionarNovoFluxo}
                style={({ pressed }) => [{
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  padding: 10,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                }]}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Adicionar</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Lista de Fluxos */}
        <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>Movimentações</Text>
        {fluxos.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: "center" }}>
            <Text style={{ color: colors.muted }}>Nenhuma movimentação neste mês</Text>
          </View>
        ) : (
          fluxos.map((fluxo) => (
            <View
              key={fluxo.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                borderLeftWidth: 4,
                borderLeftColor: fluxo.saldoDia >= 0 ? colors.success : colors.error,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ color: colors.foreground, fontWeight: "bold" }}>{fluxo.data}</Text>
                <Text style={{ color: fluxo.saldoDia >= 0 ? colors.success : colors.error, fontWeight: "bold" }}>
                  R$ {fluxo.saldoDia.toFixed(2)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 10 }}>Entradas</Text>
                  <Text style={{ color: colors.success, fontWeight: "bold" }}>+ R$ {fluxo.entradas.toFixed(2)}</Text>
                </View>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 10 }}>Saídas</Text>
                  <Text style={{ color: colors.error, fontWeight: "bold" }}>- R$ {fluxo.saidas.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
