import { useState, useEffect, useMemo } from "react";
import { ScrollView, Text, View, Pressable, Alert, StyleSheet, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getEquipamentos,
  getOrdens,
  getClientes,
  saveEquipamento,
  updateEquipamento,
  Equipamento,
  OrdemServico,
  Cliente,
} from "@/lib/store";
import { EquipamentoQR } from "@/components/equipamento-qr";
import { analisarEquipamento, EquipamentoStats } from "@/lib/equipamento-ai";

const TIPOS_STATUS = {
  ativo: { label: "Ativo", color: "#10B981", bg: "#D1FAE5", icon: "check-circle" },
  manutencao: { label: "Em manutenção", color: "#F59E0B", bg: "#FEF3C7", icon: "build" },
  inativo: { label: "Inativo", color: "#6B7280", bg: "#F3F4F6", icon: "power-settings-new" },
};

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtData = (v?: string) => {
  if (!v) return "—";
  try { return new Date(v).toLocaleDateString("pt-BR"); } catch { return v; }
};
const fmtDataHora = (v?: string) => {
  if (!v) return "—";
  try { return new Date(v).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return v; }
};

export default function EquipamentoDetail() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [equip, setEquip] = useState<Equipamento | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [oss, setOss] = useState<OrdemServico[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "historico" | "ia" | "tecnica" | "fotos">("info");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const equipamentos = await getEquipamentos();
    const found = equipamentos.find((e) => e.id === id);
    if (!found) return;

    // Retro-compat
    let upgraded = { ...found };
    let dirty = false;
    if (!upgraded.qrData) {
      upgraded.qrData = `polarsolucoes://equipamento/${upgraded.id}`;
      dirty = true;
    }
    if (!upgraded.statusOperacional) {
      upgraded.statusOperacional = "ativo";
      dirty = true;
    }
    if (!upgraded.codigoInterno) {
      upgraded.codigoInterno = `EQ-${String(upgraded.id).slice(-6).toUpperCase()}`;
      dirty = true;
    }
    if (dirty) {
      await saveEquipamento(upgraded);
    }
    setEquip(upgraded);

    const clientes = await getClientes();
    setCliente(clientes.find((c) => c.id === upgraded.clienteId) || null);

    const ordens = await getOrdens();

    // Filtro inteligente: identifica OS deste equipamento por vários critérios
    const sameStr = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
    const filtradas = ordens.filter((o) => {
      // 1) Vínculo direto pelo ID global (campo top-level)
      if (o.equipamentoId === id) return true;
      // 2) Vínculo em qualquer EquipamentoOS dentro do array
      if ((o.equipamentos || []).some((e: any) => e.equipamentoCadastradoId === id)) return true;
      // 3) Fallback retro-compat: mesmo cliente + match por número de série / marca+modelo
      if (o.clienteId === upgraded.clienteId) {
        // Match no array de equipamentos
        if (
          (o.equipamentos || []).some(
            (e: any) =>
              (upgraded.serie && sameStr(e.serie, upgraded.serie)) ||
              (upgraded.marca && upgraded.modelo && sameStr(e.marca, upgraded.marca) && sameStr(e.modelo, upgraded.modelo)),
          )
        ) {
          return true;
        }
        // Match em campos legacy top-level
        if (
          (upgraded.serie && sameStr((o as any).serie, upgraded.serie)) ||
          (upgraded.marca && upgraded.modelo && sameStr((o as any).marca, upgraded.marca) && sameStr((o as any).modelo, upgraded.modelo))
        ) {
          return true;
        }
      }
      return false;
    });

    setOss(
      filtradas.sort((a, b) => {
        const da = new Date((a as any).concluidoEm || a.atualizadoEm || a.criadoEm).getTime();
        const db = new Date((b as any).concluidoEm || b.atualizadoEm || b.criadoEm).getTime();
        return db - da;
      }),
    );
  };

  const stats: EquipamentoStats = useMemo(() => analisarEquipamento(oss), [oss]);
  const ultima = oss[0];

  const alterarStatus = async (novo: "ativo" | "manutencao" | "inativo") => {
    if (!equip) return;
    const updated = { ...equip, statusOperacional: novo };
    await updateEquipamento(updated);
    setEquip(updated);
  };

  if (!equip) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted }}>Carregando equipamento...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const statusInfo = TIPOS_STATUS[equip.statusOperacional || "ativo"];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
              {equip.nome || equip.tipo || "Equipamento"}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11 }} numberOfLines={1}>
              {equip.codigoInterno} • {equip.marca} {equip.modelo}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push(`/equipamento/editar/${equip.id}` as any)}
            style={{ padding: 6 }}
            hitSlop={10}
          >
            <MaterialIcons name="edit" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {/* HERO + STATUS BADGE */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.heroIconWrap}>
                <MaterialIcons name="kitchen" size={32} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }} numberOfLines={1}>
                  {equip.tipo || "—"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }} numberOfLines={1}>
                  {[equip.marca, equip.modelo, equip.serie && `S/N ${equip.serie}`].filter(Boolean).join(" • ") || "Sem dados técnicos"}
                </Text>
                {cliente && (
                  <Pressable onPress={() => router.push(`/cliente/${cliente.id}` as any)}>
                    <Text style={{ color: "rgba(255,255,255,0.95)", fontSize: 12, marginTop: 4, textDecorationLine: "underline" }}>
                      👤 {cliente.nome}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* STATUS PICKER */}
            <View style={{ flexDirection: "row", gap: 6, marginTop: 14 }}>
              {(Object.keys(TIPOS_STATUS) as Array<keyof typeof TIPOS_STATUS>).map((k) => {
                const info = TIPOS_STATUS[k];
                const active = equip.statusOperacional === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => alterarStatus(k)}
                    style={[
                      styles.statusPill,
                      { backgroundColor: active ? "#fff" : "rgba(255,255,255,0.15)" },
                    ]}
                  >
                    <MaterialIcons name={info.icon as any} size={12} color={active ? info.color : "#fff"} />
                    <Text style={{ color: active ? info.color : "#fff", fontSize: 10, fontWeight: "800", marginLeft: 3 }}>
                      {info.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* DASHBOARD KPIs */}
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 14 }}>
          <KpiCard icon="build" color="#1E88E5" label="Serviços" value={String(stats.totalOS)} />
          <KpiCard icon="attach-money" color="#10B981" label="Total Gasto" value={fmtBRL(stats.totalGasto).replace("R$", "")} prefix="R$" />
          <KpiCard
            icon="schedule"
            color="#F59E0B"
            label="Última"
            value={stats.diasDesdeUltima !== undefined ? `${stats.diasDesdeUltima}d` : "—"}
          />
          <KpiCard
            icon="repeat"
            color={stats.recorrenciaDefeitos >= 4 ? "#EF4444" : "#8B5CF6"}
            label="Recorr/ano"
            value={String(stats.recorrenciaDefeitos)}
          />
        </View>

        {/* TABS */}
        <View style={{ flexDirection: "row", marginTop: 18, marginHorizontal: 16, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 4 }}>
          {[
            { k: "info", label: "Info", icon: "info-outline" },
            { k: "historico", label: "Histórico", icon: "history" },
            { k: "ia", label: "IA", icon: "auto-awesome" },
            { k: "tecnica", label: "Técnica", icon: "settings" },
            { k: "fotos", label: "QR/Fotos", icon: "qr-code-2" },
          ].map((t) => (
            <Pressable
              key={t.k}
              onPress={() => setActiveTab(t.k as any)}
              style={[styles.tabBtn, { backgroundColor: activeTab === t.k ? colors.primary : "transparent" }]}
            >
              <MaterialIcons name={t.icon as any} size={14} color={activeTab === t.k ? "#fff" : colors.muted} />
              <Text style={{ fontSize: 10, fontWeight: "800", color: activeTab === t.k ? "#fff" : colors.muted, marginLeft: 3 }}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* CONTEÚDO DAS TABS */}
        <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
          {activeTab === "info" && (
            <>
              {/* IDENTIFICAÇÃO */}
              <Section title="🆔 IDENTIFICAÇÃO" colors={colors}>
                <Linha label="Código interno" value={equip.codigoInterno || "—"} />
                <Linha label="Nome" value={equip.nome || equip.tipo || "—"} />
                <Linha label="Tipo" value={equip.tipo || "—"} />
                <Linha label="Marca" value={equip.marca || "—"} />
                <Linha label="Modelo" value={equip.modelo || "—"} />
                <Linha label="Nº Série" value={equip.serie || "—"} />
                <Linha label="Local de instalação" value={equip.localInstalacao || "—"} />
                <Linha label="Cliente" value={cliente?.nome || "—"} />
                <Linha label="Data de cadastro" value={fmtData(equip.criadoEm)} last />
              </Section>

              {/* ÚLTIMO ATENDIMENTO */}
              {ultima && (
                <Section title="🛠 ÚLTIMO ATENDIMENTO" colors={colors} highlight>
                  <Pressable onPress={() => router.push(`/os/${ultima.id}` as any)}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 14 }}>
                          OS #{ultima.numero}
                        </Text>
                        <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                          {fmtDataHora((ultima as any).concluidoEm || ultima.atualizadoEm)}
                        </Text>
                      </View>
                      <Text style={{ color: "#10B981", fontWeight: "900", fontSize: 15 }}>
                        {fmtBRL((ultima as any).valorTotal || 0)}
                      </Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />
                    <Linha label="Técnico" value={(ultima as any).tecnicoResponsavel || "—"} />
                    <Linha label="Problema" value={ultima.problema || "—"} multiLine />
                    <Linha label="Diagnóstico" value={ultima.diagnostico || "—"} multiLine />
                    {ultima.materiais && ultima.materiais.length > 0 && (
                      <Linha
                        label="Peças"
                        value={ultima.materiais.map((m) => `${m.quantidade}x ${m.descricao}`).join(", ")}
                        multiLine
                      />
                    )}
                    {(ultima as any).observacaoTecnica && (
                      <Linha label="Garantia/Obs" value={(ultima as any).observacaoTecnica} multiLine last />
                    )}
                  </Pressable>
                </Section>
              )}

              {/* PRÓXIMA PREVENTIVA */}
              {stats.proximaPreventiva && (
                <View style={[styles.banner, { backgroundColor: "#EFF6FF", borderColor: "#3B82F6" }]}>
                  <MaterialIcons name="event-available" size={20} color="#1E40AF" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ color: "#1E40AF", fontSize: 11, fontWeight: "800" }}>PRÓXIMA PREVENTIVA</Text>
                    <Text style={{ color: "#1E3A8A", fontSize: 13, fontWeight: "700" }}>
                      {fmtData(stats.proximaPreventiva)}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          {activeTab === "historico" && (
            <Section title={`📜 HISTÓRICO COMPLETO (${oss.length})`} colors={colors}>
              {oss.length === 0 ? (
                <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center", paddingVertical: 24 }}>
                  Nenhuma ordem de serviço registrada ainda.
                </Text>
              ) : (
                <View style={{ position: "relative" }}>
                  {/* Linha vertical da timeline */}
                  <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                  {oss.map((os, idx) => {
                    const isExpanded = expanded === os.id;
                    return (
                      <View key={os.id} style={{ position: "relative", paddingLeft: 28, marginBottom: 12 }}>
                        {/* Bolinha da timeline */}
                        <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                        <Pressable
                          onPress={() => setExpanded(isExpanded ? null : os.id)}
                          style={[styles.historicoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "800" }}>
                                OS #{os.numero}
                              </Text>
                              <Text style={{ color: colors.muted, fontSize: 10 }}>
                                {fmtData((os as any).concluidoEm || os.atualizadoEm)}
                              </Text>
                            </View>
                            <Text style={{ color: "#10B981", fontWeight: "800", fontSize: 13 }}>
                              {fmtBRL((os as any).valorTotal || 0)}
                            </Text>
                            <MaterialIcons name={isExpanded ? "expand-less" : "expand-more"} size={20} color={colors.muted} />
                          </View>
                          {isExpanded && (
                            <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
                              <Linha label="Técnico" value={(os as any).tecnicoResponsavel || "—"} />
                              <Linha label="Problema" value={os.problema || "—"} multiLine />
                              <Linha label="Diagnóstico" value={os.diagnostico || "—"} multiLine />
                              {os.materiais && os.materiais.length > 0 && (
                                <Linha
                                  label="Peças"
                                  value={os.materiais.map((m) => `${m.quantidade}x ${m.descricao}`).join(", ")}
                                  multiLine
                                />
                              )}
                              {(os as any).observacaoTecnica && (
                                <Linha label="Observações" value={(os as any).observacaoTecnica} multiLine />
                              )}
                              <Pressable
                                onPress={() => router.push(`/os/${os.id}` as any)}
                                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8, paddingVertical: 8, backgroundColor: colors.primary + "15", borderRadius: 8 }}
                              >
                                <MaterialIcons name="open-in-new" size={14} color={colors.primary} />
                                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700", marginLeft: 4 }}>
                                  Abrir OS completa
                                </Text>
                              </Pressable>
                            </View>
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </Section>
          )}

          {activeTab === "ia" && (
            <Section title="🤖 INTELIGÊNCIA ARTIFICIAL" colors={colors}>
              <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 12 }}>
                Análise automática do histórico para detectar padrões e recomendações.
              </Text>
              {stats.insights.map((ins, idx) => {
                const cores = {
                  critico: { bg: "#FEE2E2", border: "#EF4444", color: "#991B1B" },
                  atencao: { bg: "#FEF3C7", border: "#F59E0B", color: "#92400E" },
                  info: { bg: "#DBEAFE", border: "#3B82F6", color: "#1E40AF" },
                  sucesso: { bg: "#D1FAE5", border: "#10B981", color: "#065F46" },
                }[ins.tipo];
                return (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: cores.bg,
                      borderLeftWidth: 4,
                      borderLeftColor: cores.border,
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 10,
                      flexDirection: "row",
                    }}
                  >
                    <MaterialIcons name={ins.icone as any} size={22} color={cores.color} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ color: cores.color, fontWeight: "900", fontSize: 13 }}>
                        {ins.titulo}
                      </Text>
                      <Text style={{ color: cores.color, fontSize: 11, marginTop: 3, lineHeight: 16 }}>
                        {ins.mensagem}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Section>
          )}

          {activeTab === "tecnica" && (
            <Section title="⚙️ INFORMAÇÕES TÉCNICAS" colors={colors}>
              <Linha label="Tipo de gás" value={equip.infoTecnica?.tipoGas || "—"} />
              <Linha label="Quantidade de gás" value={equip.infoTecnica?.qtdGas || "—"} />
              <Linha label="Tensão" value={equip.infoTecnica?.tensao || "—"} />
              <Linha label="Corrente" value={equip.infoTecnica?.corrente || "—"} />
              <Linha label="Potência" value={equip.infoTecnica?.potencia || "—"} />
              <Linha label="Compressor instalado" value={equip.infoTecnica?.compressor || "—"} />
              <Linha
                label="Observações"
                value={equip.infoTecnica?.obsTecnicas || equip.observacoes || "—"}
                multiLine
                last
              />
              <Pressable
                onPress={() => router.push(`/equipamento/editar/${equip.id}` as any)}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12, paddingVertical: 10, backgroundColor: colors.primary + "15", borderRadius: 8 }}
              >
                <MaterialIcons name="edit" size={14} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700", marginLeft: 4 }}>
                  Editar informações técnicas
                </Text>
              </Pressable>
            </Section>
          )}

          {activeTab === "fotos" && (
            <>
              {/* QR Code */}
              <Section title="📱 QR CODE DO EQUIPAMENTO" colors={colors}>
                <View style={{ alignItems: "center" }}>
                  <EquipamentoQR equipamento={equip} clienteNome={cliente?.nome} size={200} />
                </View>
              </Section>

              {/* Fotos */}
              <Section title={`📷 FOTOS (${(equip.fotos || []).length})`} colors={colors}>
                {(equip.fotos || []).length === 0 ? (
                  <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center", paddingVertical: 12 }}>
                    Nenhuma foto cadastrada. Use o botão "Editar" para adicionar.
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {(equip.fotos || []).map((foto, idx) => (
                      <Image
                        key={idx}
                        source={{ uri: foto.startsWith("data:") ? foto : `data:image/jpeg;base64,${foto}` }}
                        style={{ width: 120, height: 120, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}
                      />
                    ))}
                  </ScrollView>
                )}
              </Section>

              {/* Documentos OS */}
              <Section title={`📄 OS GERADAS (${oss.length})`} colors={colors}>
                {oss.length === 0 ? (
                  <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center", paddingVertical: 12 }}>
                    Nenhuma OS gerada ainda.
                  </Text>
                ) : (
                  oss.map((os) => (
                    <Pressable
                      key={os.id}
                      onPress={() => router.push(`/os/${os.id}` as any)}
                      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}
                    >
                      <MaterialIcons name="description" size={18} color={colors.primary} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>
                          OS #{os.numero}
                        </Text>
                        <Text style={{ color: colors.muted, fontSize: 10 }}>
                          {fmtData((os as any).concluidoEm || os.atualizadoEm)}
                        </Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={16} color={colors.muted} />
                    </Pressable>
                  ))
                )}
              </Section>
            </>
          )}
        </View>

        {/* BOTÃO NOVA MANUTENÇÃO */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Pressable
            onPress={() => router.push({ pathname: "/os/nova", params: { equipamentoId: equip.id, clienteId: equip.clienteId } } as any)}
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <MaterialIcons name="add" size={22} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14, marginLeft: 8 }}>
              NOVA MANUTENÇÃO
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── COMPONENTES ─────────────────────────────────────────────────────
function KpiCard({ icon, color, label, value, prefix }: { icon: string; color: string; label: string; value: string; prefix?: string }) {
  return (
    <View style={[styles.kpiCard, { backgroundColor: "#fff", borderColor: "#E5E7EB" }]}>
      <View style={[styles.kpiIcon, { backgroundColor: color + "20" }]}>
        <MaterialIcons name={icon as any} size={16} color={color} />
      </View>
      <Text style={{ color: "#9CA3AF", fontSize: 9, fontWeight: "800", marginTop: 4 }}>{label}</Text>
      <Text style={{ color: "#0F172A", fontSize: 13, fontWeight: "900", marginTop: 1 }} numberOfLines={1}>
        {prefix ? <Text style={{ fontSize: 9 }}>{prefix} </Text> : null}
        {value}
      </Text>
    </View>
  );
}

function Section({ title, colors, children, highlight }: any) {
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.surface, borderColor: highlight ? colors.primary : colors.border, borderWidth: highlight ? 2 : 1 },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: highlight ? colors.primary : colors.muted }]}>{title}</Text>
      {children}
    </View>
  );
}

function Linha({ label, value, last, multiLine }: { label: string; value: string; last?: boolean; multiLine?: boolean }) {
  return (
    <View
      style={{
        flexDirection: multiLine ? "column" : "row",
        justifyContent: "space-between",
        alignItems: multiLine ? "flex-start" : "center",
        paddingVertical: 6,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: "#F1F5F9",
      }}
    >
      <Text style={{ color: "#64748B", fontSize: 11, fontWeight: "600", marginBottom: multiLine ? 2 : 0 }}>{label}</Text>
      <Text
        style={{ color: "#0F172A", fontSize: 12, fontWeight: "700", flex: multiLine ? 0 : 1, textAlign: multiLine ? "left" : "right", marginLeft: multiLine ? 0 : 8 }}
        numberOfLines={multiLine ? undefined : 2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: "900" },
  heroCard: { borderRadius: 16, padding: 16 },
  heroIconWrap: { width: 56, height: 56, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  statusPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  kpiCard: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 1 },
  kpiIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", justifyContent: "center", borderRadius: 8, flexDirection: "row" },
  section: { borderRadius: 12, padding: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: "900", marginBottom: 10, letterSpacing: 0.5 },
  banner: { flexDirection: "row", alignItems: "center", borderLeftWidth: 4, borderRadius: 8, padding: 12, marginBottom: 12 },
  fab: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { height: 3, width: 0 }, elevation: 5 },
  timelineLine: { position: "absolute", left: 9, top: 0, bottom: 0, width: 2 },
  timelineDot: { position: "absolute", left: 4, top: 14, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#fff", zIndex: 1 },
  historicoCard: { padding: 10, borderRadius: 10, borderWidth: 1 },
});
