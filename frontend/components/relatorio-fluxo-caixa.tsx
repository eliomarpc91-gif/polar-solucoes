import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from "react-native";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  getSaidasManuais,
  saveSaidaManual,
  deleteSaidaManual,
} from "@/lib/store";
import type { SaidaFinanceira } from "@/lib/financeiro-automatico-types";

interface Cobranca {
  id: string;
  clienteNome?: string;
  descricao?: string;
  valorTotal: number;
  valorRecebido?: number;
  valorPendente?: number;
  status: string;
  dataPagamento?: string;
  dataCriacao?: string;
  dataVencimento?: string;
}

interface RelatorioFluxoCaixaProps {
  cobrancas: Cobranca[];
  periodo: 7 | 30 | 90;
}

type Aba = "entradas" | "saidas" | "pendentes";

const CATEGORIAS = [
  "Operacional",
  "Fornecedor",
  "Transporte",
  "Alimentação",
  "Equipamento",
  "Material",
  "Impostos",
  "Outros",
];

const FORMAS_PG = ["Dinheiro", "PIX", "Cartão", "Boleto", "Transferência"];

function genId() {
  return `saida_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function RelatorioFluxoCaixa({
  cobrancas,
  periodo,
}: RelatorioFluxoCaixaProps) {
  const colors = useColors();
  const [aba, setAba] = useState<Aba>("entradas");
  const [saidas, setSaidas] = useState<SaidaFinanceira[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    categoria: "Operacional",
    formaPagamento: "Dinheiro",
    fornecedor: "",
  });

  useEffect(() => {
    loadSaidas();
  }, []);

  const loadSaidas = async () => {
    const s = await getSaidasManuais();
    setSaidas(s);
  };

  // Janela de período
  const hoje = new Date();
  const dataLimite = new Date(hoje.getTime() - periodo * 24 * 60 * 60 * 1000);

  // ENTRADAS = pagamentos efetivamente recebidos (status pago ou parcial)
  const entradas = cobrancas
    .filter((c) => {
      if (c.status !== "pago" && c.status !== "parcial") return false;
      const ref = new Date(c.dataPagamento || c.dataCriacao || "");
      return ref >= dataLimite && ref <= hoje;
    })
    .map((c) => ({
      id: c.id,
      data: c.dataPagamento || c.dataCriacao || "",
      titulo: c.clienteNome || c.descricao || "Cobrança",
      descricao: c.descricao,
      valor:
        c.status === "pago"
          ? c.valorTotal
          : c.valorRecebido || 0,
    }))
    .sort((a, b) => (a.data < b.data ? 1 : -1));

  // PENDENTES = cobranças ainda não pagas totalmente
  const pendentes = cobrancas
    .filter((c) => c.status === "pendente" || c.status === "parcial")
    .map((c) => ({
      id: c.id,
      data: c.dataVencimento || c.dataCriacao || "",
      titulo: c.clienteNome || c.descricao || "Cobrança",
      descricao: c.descricao,
      valor:
        c.status === "parcial"
          ? c.valorPendente ?? (c.valorTotal - (c.valorRecebido || 0))
          : c.valorTotal,
      vencimento: c.dataVencimento,
    }))
    .sort((a, b) => (a.data < b.data ? 1 : -1));

  // SAÍDAS = manuais registradas pelo usuário no período
  const saidasFiltradas = saidas
    .filter((s) => {
      const ref = new Date(s.data);
      return ref >= dataLimite && ref <= hoje;
    })
    .sort((a, b) => (a.data < b.data ? 1 : -1));

  const totalEntradas = entradas.reduce((s, e) => s + e.valor, 0);
  const totalSaidas = saidasFiltradas.reduce((s, e) => s + (e.valor || 0), 0);
  const totalPendentes = pendentes.reduce((s, e) => s + e.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  const submitSaida = async () => {
    const valor = parseFloat(form.valor.replace(",", ".")) || 0;
    if (!form.descricao || valor <= 0) {
      Alert.alert("Erro", "Informe a descrição e um valor maior que zero.");
      return;
    }
    const nova: SaidaFinanceira = {
      id: genId(),
      data: new Date().toISOString().split("T")[0],
      descricao: form.descricao,
      categoria: form.categoria as any,
      valor,
      formaPagamento: form.formaPagamento as any,
      fornecedor: form.fornecedor || undefined,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };
    await saveSaidaManual(nova);
    setForm({
      descricao: "",
      valor: "",
      categoria: "Operacional",
      formaPagamento: "Dinheiro",
      fornecedor: "",
    });
    setShowAdd(false);
    loadSaidas();
  };

  const removerSaida = (id: string) => {
    Alert.alert("Excluir saída", "Deseja excluir esta saída?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await deleteSaidaManual(id);
          loadSaidas();
        },
      },
    ]);
  };

  return (
    <View>
      {/* Cards de resumo */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        <CardResumo
          label="Entradas"
          valor={totalEntradas}
          color="#10B981"
          colors={colors}
        />
        <CardResumo
          label="Saídas"
          valor={totalSaidas}
          color="#EF4444"
          colors={colors}
        />
        <CardResumo
          label="Saldo"
          valor={saldo}
          color={saldo >= 0 ? "#10B981" : "#EF4444"}
          colors={colors}
        />
      </View>

      <View
        style={{
          backgroundColor: colors.warning + "15",
          borderLeftWidth: 4,
          borderLeftColor: colors.warning,
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: colors.muted, fontSize: 11 }}>A RECEBER (pendentes)</Text>
        <Text style={{ color: colors.warning, fontSize: 18, fontWeight: "700" }}>
          R$ {totalPendentes.toFixed(2)}
        </Text>
      </View>

      {/* Abas */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginBottom: 12,
        }}
      >
        {[
          { id: "entradas" as Aba, label: "Entradas", color: "#10B981" },
          { id: "saidas" as Aba, label: "Saídas", color: "#EF4444" },
          { id: "pendentes" as Aba, label: "Pendentes", color: colors.warning },
        ].map((t) => {
          const ativo = aba === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setAba(t.id)}
              testID={`fluxo-aba-${t.id}`}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: ativo ? t.color : colors.surface,
                borderWidth: 1,
                borderColor: ativo ? t.color : colors.border,
                opacity: pressed ? 0.7 : 1,
                alignItems: "center",
              })}
            >
              <Text
                style={{
                  color: ativo ? "#fff" : colors.foreground,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Lista */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          minHeight: 200,
        }}
      >
        {aba === "entradas" && (
          <ListaItens
            items={entradas}
            empty="Nenhuma entrada no período."
            colors={colors}
            corValor="#10B981"
          />
        )}

        {aba === "pendentes" && (
          <ListaItens
            items={pendentes}
            empty="Nenhuma cobrança pendente."
            colors={colors}
            corValor={colors.warning}
            mostrarVencimento
          />
        )}

        {aba === "saidas" && (
          <View>
            <Pressable
              onPress={() => setShowAdd(true)}
              testID="btn-nova-saida"
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                backgroundColor: "#EF4444",
                paddingVertical: 12,
                borderRadius: 10,
                marginBottom: 12,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MaterialIcons name="add" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                Registrar saída
              </Text>
            </Pressable>

            {saidasFiltradas.length === 0 ? (
              <EmptyState
                colors={colors}
                msg="Nenhuma saída registrada no período."
              />
            ) : (
              saidasFiltradas.map((s) => (
                <View
                  key={s.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      {s.descricao}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                      {s.categoria} •{" "}
                      {new Date(s.data).toLocaleDateString("pt-BR")}
                      {s.fornecedor ? ` • ${s.fornecedor}` : ""}
                    </Text>
                  </View>
                  <Text style={{ color: "#EF4444", fontSize: 14, fontWeight: "700" }}>
                    - R$ {(s.valor || 0).toFixed(2)}
                  </Text>
                  <Pressable
                    onPress={() => removerSaida(s.id)}
                    style={{ marginLeft: 8 }}
                    testID={`saida-remove-${s.id}`}
                  >
                    <MaterialIcons name="delete-outline" size={20} color={colors.muted} />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}
      </View>

      {/* Modal nova saída */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              padding: 20,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              maxHeight: "85%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700" }}>
                Nova saída
              </Text>
              <Pressable onPress={() => setShowAdd(false)} testID="fechar-modal-saida">
                <MaterialIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView>
              <Field label="Descrição" colors={colors}>
                <TextInput
                  value={form.descricao}
                  onChangeText={(t) => setForm({ ...form, descricao: t })}
                  placeholder="Ex: Compra de cabos"
                  placeholderTextColor={colors.muted}
                  style={inputStyle(colors)}
                  testID="saida-descricao"
                />
              </Field>

              <Field label="Valor (R$)" colors={colors}>
                <TextInput
                  value={form.valor}
                  onChangeText={(t) => setForm({ ...form, valor: t })}
                  placeholder="0,00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.muted}
                  style={inputStyle(colors)}
                  testID="saida-valor"
                />
              </Field>

              <Field label="Categoria" colors={colors}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {CATEGORIAS.map((c) => {
                    const sel = form.categoria === c;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setForm({ ...form, categoria: c })}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: sel ? colors.primary : colors.surface,
                          borderWidth: 1,
                          borderColor: sel ? colors.primary : colors.border,
                        }}
                      >
                        <Text
                          style={{
                            color: sel ? "#fff" : colors.foreground,
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>

              <Field label="Forma de pagamento" colors={colors}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {FORMAS_PG.map((f) => {
                    const sel = form.formaPagamento === f;
                    return (
                      <Pressable
                        key={f}
                        onPress={() => setForm({ ...form, formaPagamento: f })}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: sel ? colors.primary : colors.surface,
                          borderWidth: 1,
                          borderColor: sel ? colors.primary : colors.border,
                        }}
                      >
                        <Text
                          style={{
                            color: sel ? "#fff" : colors.foreground,
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {f}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>

              <Field label="Fornecedor (opcional)" colors={colors}>
                <TextInput
                  value={form.fornecedor}
                  onChangeText={(t) => setForm({ ...form, fornecedor: t })}
                  placeholder="Ex: Loja XYZ"
                  placeholderTextColor={colors.muted}
                  style={inputStyle(colors)}
                />
              </Field>

              <Pressable
                onPress={submitSaida}
                testID="confirmar-saida"
                style={({ pressed }) => ({
                  backgroundColor: "#EF4444",
                  padding: 14,
                  borderRadius: 10,
                  alignItems: "center",
                  marginTop: 12,
                  marginBottom: 30,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                  Salvar saída
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function CardResumo({
  label,
  valor,
  color,
  colors,
}: {
  label: string;
  valor: number;
  color: string;
  colors: any;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        borderLeftWidth: 4,
        borderLeftColor: color,
      }}
    >
      <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: "700", color }}>
        R$ {valor.toFixed(2)}
      </Text>
    </View>
  );
}

function ListaItens({
  items,
  empty,
  colors,
  corValor,
  mostrarVencimento,
}: {
  items: any[];
  empty: string;
  colors: any;
  corValor: string;
  mostrarVencimento?: boolean;
}) {
  if (items.length === 0) return <EmptyState colors={colors} msg={empty} />;
  return (
    <View>
      {items.map((i) => (
        <View
          key={i.id}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
              {i.titulo}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
              {mostrarVencimento && i.vencimento
                ? `Vence: ${new Date(i.vencimento).toLocaleDateString("pt-BR")}`
                : i.data
                  ? new Date(i.data).toLocaleDateString("pt-BR")
                  : ""}
              {i.descricao ? ` • ${i.descricao}` : ""}
            </Text>
          </View>
          <Text style={{ color: corValor, fontSize: 14, fontWeight: "700" }}>
            R$ {i.valor.toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function EmptyState({ colors, msg }: { colors: any; msg: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 30 }}>
      <MaterialIcons name="inbox" size={36} color={colors.muted} />
      <Text style={{ color: colors.muted, marginTop: 8, fontSize: 13 }}>{msg}</Text>
    </View>
  );
}

function Field({
  label,
  colors,
  children,
}: {
  label: string;
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          color: colors.muted,
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 6,
          marginLeft: 2,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

function inputStyle(colors: any) {
  return {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.foreground,
    fontSize: 14,
  } as const;
}
