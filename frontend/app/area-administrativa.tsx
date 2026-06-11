import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

interface Documento {
  id: string;
  nome: string;
  tipo: string;
  dataUpload: string;
  tamanho: string;
  categoria: string;
}

export default function AreaAdministrativaScreen() {
  const colors = useColors();
  const [documentos, setDocumentos] = useState<Documento[]>([
    { id: "1", nome: "Contrato Social", tipo: "PDF", dataUpload: "2026-01-15", tamanho: "2.5 MB", categoria: "Empresa" },
    { id: "2", nome: "Certificado Digital", tipo: "PEM", dataUpload: "2026-02-01", tamanho: "1.2 MB", categoria: "Segurança" },
    { id: "3", nome: "Licença de Funcionamento", tipo: "PDF", dataUpload: "2026-03-10", tamanho: "890 KB", categoria: "Licenças" },
  ]);
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);

  const categorias = ["Empresa", "Segurança", "Licenças", "Financeiro", "RH"];

  const documentosFiltrados = filtroCategoria
    ? documentos.filter((d) => d.categoria === filtroCategoria)
    : documentos;

  const CartaoDocumento = ({ doc }: { doc: Documento }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <View style={{ backgroundColor: colors.primary + "20", borderRadius: 8, padding: 8 }}>
          <MaterialIcons name="description" size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 4 }}>
            {doc.nome}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {doc.tipo} • {doc.tamanho}
          </Text>
        </View>
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="download" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View
          style={{
            backgroundColor: colors.border + "20",
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 11 }}>
            {doc.categoria}
          </Text>
        </View>
        <Text style={{ color: colors.muted, fontSize: 11 }}>
          {doc.dataUpload}
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Área Administrativa
        </Text>

        {/* Menu Rápido */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12 }}>
            FUNÇÕES ADMINISTRATIVAS
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            <Pressable
              style={({ pressed }) => [{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
                gap: 6,
                opacity: pressed ? 0.7 : 1,
              }]}
            >
              <MaterialIcons name="upload-file" size={20} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 12, textAlign: "center" }}>
                Upload
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
                gap: 6,
                opacity: pressed ? 0.7 : 1,
              }]}
            >
              <MaterialIcons name="backup" size={20} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 12, textAlign: "center" }}>
                Backup
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
                gap: 6,
                opacity: pressed ? 0.7 : 1,
              }]}
            >
              <MaterialIcons name="settings" size={20} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 12, textAlign: "center" }}>
                Configurações
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Filtro */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
            FILTRAR POR CATEGORIA
          </Text>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {categorias.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setFiltroCategoria(filtroCategoria === cat ? null : cat)}
                style={({ pressed }) => [{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: filtroCategoria === cat ? colors.primary : colors.surface,
                  opacity: pressed ? 0.7 : 1,
                }]}
              >
                <Text
                  style={{
                    color: filtroCategoria === cat ? "white" : colors.foreground,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Documentos */}
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12 }}>
          DOCUMENTOS ({documentosFiltrados.length})
        </Text>

        {documentosFiltrados.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
            }}
          >
            <MaterialIcons name="folder-open" size={48} color={colors.muted} />
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginTop: 12 }}>
              Nenhum documento
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, textAlign: "center" }}>
              Nenhum documento encontrado nesta categoria
            </Text>
          </View>
        ) : (
          documentosFiltrados.map((doc) => (
            <CartaoDocumento key={doc.id} doc={doc} />
          ))
        )}

        {/* Espaço em Armazenamento */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12 }}>
            ARMAZENAMENTO
          </Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
                Espaço Utilizado
              </Text>
              <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
                4.6 GB / 10 GB
              </Text>
            </View>
            <View
              style={{
                height: 8,
                backgroundColor: colors.border,
                borderRadius: 4,
                overflow: "hidden",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: "46%",
                  backgroundColor: colors.primary,
                }}
              />
            </View>
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              5.4 GB disponível
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
