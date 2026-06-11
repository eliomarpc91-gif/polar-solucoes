import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, TextInput, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { obterConfiguracaoReserva, atualizarConfiguracaoReserva } from "@/lib/financeiro-store";
import { ConfiguracaoReserva, ReservaFinanceira } from "@/lib/financeiro-types";

// Componente isolado fora do principal para evitar perder foco do teclado
function CampoPercentual({ label, value, onChange, editando, colors }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TextInput
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
            fontSize: 14,
          }}
          placeholder="0"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={onChange}
          editable={editando}
        />
        <Text style={{ color: colors.foreground, marginLeft: 8, fontWeight: "bold" }}>%</Text>
      </View>
    </View>
  );
}

export default function ReservaAutomaticaScreen() {
  const colors = useColors();
  const [config, setConfig] = useState<ConfiguracaoReserva | null>(null);
  const [historico, setHistorico] = useState<ReservaFinanceira[]>([]);
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState({
    percentualImposto: "15",
    percentualCapitalGiro: "10",
    percentualManutencao: "5",
    percentualReservaEmpresa: "20",
    percentualLucroLiquido: "50",
  });

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const cfg = await obterConfiguracaoReserva();
    if (cfg) {
      setConfig(cfg);
      setValores({
        percentualImposto: cfg.percentualImposto.toString(),
        percentualCapitalGiro: cfg.percentualCapitalGiro.toString(),
        percentualManutencao: cfg.percentualManutencao.toString(),
        percentualReservaEmpresa: cfg.percentualReservaEmpresa.toString(),
        percentualLucroLiquido: cfg.percentualLucroLiquido.toString(),
      });
    }
    // Histórico será carregado quando houver dados de reserva
    setHistorico([]);
  }

  async function salvarConfiguracao() {
    const novaConfig: ConfiguracaoReserva = {
      id: config?.id || Date.now().toString(),
      percentualImposto: parseFloat(valores.percentualImposto) || 0,
      percentualCapitalGiro: parseFloat(valores.percentualCapitalGiro) || 0,
      percentualManutencao: parseFloat(valores.percentualManutencao) || 0,
      percentualReservaEmpresa: parseFloat(valores.percentualReservaEmpresa) || 0,
      percentualLucroLiquido: parseFloat(valores.percentualLucroLiquido) || 0,
      criado_em: config?.criado_em || new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };
    await atualizarConfiguracaoReserva(novaConfig);
    setConfig(novaConfig);
    setEditando(false);
  }

  const totalPercentual = 
    parseFloat(valores.percentualImposto || "0") +
    parseFloat(valores.percentualCapitalGiro || "0") +
    parseFloat(valores.percentualManutencao || "0") +
    parseFloat(valores.percentualReservaEmpresa || "0") +
    parseFloat(valores.percentualLucroLiquido || "0");

  const isValido = totalPercentual <= 100;

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Reserva Automática
        </Text>

        {/* Configuração */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 16 }}>Configuração de Separação</Text>
            <Pressable
              onPress={() => {
                if (editando) {
                  salvarConfiguracao();
                } else {
                  setEditando(true);
                }
              }}
              style={({ pressed }) => [{
                backgroundColor: editando ? colors.success : colors.primary,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                opacity: pressed ? 0.7 : 1,
              }]}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 12 }}>
                {editando ? "Salvar" : "Editar"}
              </Text>
            </Pressable>
          </View>

          <CampoPercentual
            label="Impostos (ICMS, ISS, etc)"
            value={valores.percentualImposto}
            onChange={(text: string) => setValores({ ...valores, percentualImposto: text })}
            editando={editando}
            colors={colors}
          />
          <CampoPercentual
            label="Capital de Giro"
            value={valores.percentualCapitalGiro}
            onChange={(text: string) => setValores({ ...valores, percentualCapitalGiro: text })}
            editando={editando}
            colors={colors}
          />
          <CampoPercentual
            label="Manutenção e Equipamentos"
            value={valores.percentualManutencao}
            onChange={(text: string) => setValores({ ...valores, percentualManutencao: text })}
            editando={editando}
            colors={colors}
          />
          <CampoPercentual
            label="Reserva da Empresa"
            value={valores.percentualReservaEmpresa}
            onChange={(text: string) => setValores({ ...valores, percentualReservaEmpresa: text })}
            editando={editando}
            colors={colors}
          />
          <CampoPercentual
            label="Lucro Líquido (Pró-labore)"
            value={valores.percentualLucroLiquido}
            onChange={(text: string) => setValores({ ...valores, percentualLucroLiquido: text })}
            editando={editando}
            colors={colors}
          />

          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: colors.foreground, fontWeight: "bold" }}>Total</Text>
              <Text style={{ color: isValido ? colors.success : colors.error, fontWeight: "bold", fontSize: 16 }}>
                {totalPercentual.toFixed(1)}%
              </Text>
            </View>
            {!isValido && (
              <Text style={{ color: colors.error, fontSize: 12, marginTop: 8 }}>
                ⚠️ Total não pode exceder 100%
              </Text>
            )}
          </View>
        </View>

        {/* Histórico */}
        <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 16, marginBottom: 12 }}>
          Histórico de Separações ({historico.length})
        </Text>

        {historico.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: "center" }}>
            <Text style={{ color: colors.muted }}>Nenhuma separação registrada</Text>
          </View>
        ) : (
          historico.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                borderLeftWidth: 4,
                borderLeftColor: colors.primary,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
                  R$ {item.valorTotal.toFixed(2)}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{item.dataRecebimento}</Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontSize: 10 }}>Impostos</Text>
                  <Text style={{ color: colors.error, fontWeight: "bold", marginTop: 2 }}>
                    R$ {item.impostos.toFixed(2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontSize: 10 }}>Capital</Text>
                  <Text style={{ color: colors.warning, fontWeight: "bold", marginTop: 2 }}>
                    R$ {item.capitalGiro.toFixed(2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontSize: 10 }}>Manutenção</Text>
                  <Text style={{ color: colors.foreground, fontWeight: "bold", marginTop: 2 }}>
                    R$ {item.manutencao.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontSize: 10 }}>Reserva</Text>
                  <Text style={{ color: colors.primary, fontWeight: "bold", marginTop: 2 }}>
                    R$ {item.reservaEmpresa.toFixed(2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontSize: 10 }}>Lucro</Text>
                  <Text style={{ color: colors.success, fontWeight: "bold", marginTop: 2 }}>
                    R$ {item.lucroLiquido.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
