import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function PIXPagamentosScreen() {
  const colors = useColors();
  const [chavePixSelecionada, setChavePixSelecionada] = useState<string | null>(null);
   const [novaChave, setNovaChave] = useState("");
  const [tipoChave, setTipoChave] = useState<"cpf" | "cnpj" | "email" | "telefone" | "aleatoria">("cpf");
  const [chaves, setChaves] = useState([
    { id: "1", tipo: "cpf", valor: "123.456.789-00", principal: true },
    { id: "2", tipo: "email", valor: "empresa@example.com", principal: false },
  ]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const obterIconeChave = (tipo: string) => {
    const map: any = {
      cpf: "person",
      cnpj: "business",
      email: "mail",
      telefone: "phone",
      aleatoria: "vpn-key",
    };
    return map[tipo] || "vpn-key";
  };

  const obterTextoChave = (tipo: string) => {
    const map: any = {
      cpf: "CPF",
      cnpj: "CNPJ",
      email: "Email",
      telefone: "Telefone",
      aleatoria: "Aleatória",
    };
    return map[tipo] || tipo;
  };

  const handleAdicionarChave = () => {
    if (!novaChave.trim()) {
      Alert.alert("Erro", "Digite uma chave PIX");
      return;
    }

    const novaChaveObj = {
      id: Date.now().toString(),
      tipo: tipoChave,
      valor: novaChave,
      principal: chaves.length === 0,
    };

    setChaves([...chaves, novaChaveObj]);
    setNovaChave("");
    Alert.alert("Sucesso", "Chave PIX adicionada com sucesso!");
  };

  const handleRemoverChave = (id: string) => {
    Alert.alert("Remover Chave", "Tem certeza que deseja remover esta chave PIX?", [
      { text: "Cancelar", onPress: () => {} },
      {
        text: "Remover",
        onPress: () => {
          setChaves(chaves.filter((c) => c.id !== id));
        },
      },
    ]);
  };

  const CartaoChave = ({ chave }: any) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: chave.principal ? colors.primary : colors.border,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
          <View style={{ backgroundColor: colors.primary + "20", borderRadius: 8, padding: 8 }}>
            <MaterialIcons name={obterIconeChave(chave.tipo)} size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 2 }}>
              {obterTextoChave(chave.tipo)}
            </Text>
            <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 14 }}>
              {chave.valor}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => handleRemoverChave(chave.id)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="close" size={20} color={colors.error} />
        </Pressable>
      </View>

      {chave.principal && (
        <View
          style={{
            backgroundColor: colors.primary + "20",
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
            alignSelf: "flex-start",
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 11 }}>
            Chave Principal
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Integração PIX
        </Text>

        {/* Info */}
        <View
          style={{
            backgroundColor: colors.primary + "10",
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 12, lineHeight: 16 }}>
            💡 <Text style={{ fontWeight: "bold" }}>PIX Integrado:</Text> Receba pagamentos instantaneamente. Suas chaves PIX estão seguras e prontas para uso.
          </Text>
        </View>

        {/* Resumo */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 8, padding: 12 }}>
            <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>
              Chaves Cadastradas
            </Text>
            <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 18 }}>
              {chaves.length}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 8, padding: 12 }}>
            <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>
              Status
            </Text>
            <Text style={{ color: colors.success, fontWeight: "bold", fontSize: 14 }}>
              ✅ Ativo
            </Text>
          </View>
        </View>

        {/* Adicionar Nova Chave */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>
            Adicionar Nova Chave PIX
          </Text>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
              TIPO DE CHAVE
            </Text>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {["cpf", "cnpj", "email", "telefone", "aleatoria"].map((tipo) => (
                <Pressable
                  key={tipo}
                  onPress={() => setTipoChave(tipo as any)}
                  style={({ pressed }) => [{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: tipoChave === tipo ? colors.primary : colors.border + "20",
                    opacity: pressed ? 0.7 : 1,
                  }]}
                >
                  <Text
                    style={{
                      color: tipoChave === tipo ? "white" : colors.foreground,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {obterTextoChave(tipo)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
              VALOR DA CHAVE
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.foreground,
                fontSize: 14,
              }}
              placeholder="Digite a chave PIX"
              placeholderTextColor={colors.muted}
              value={novaChave}
              onChangeText={setNovaChave}
            />
          </View>

          <Pressable
            onPress={handleAdicionarChave}
            style={({ pressed }) => [{
              backgroundColor: colors.primary,
              borderRadius: 8,
              paddingVertical: 12,
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>
              Adicionar Chave
            </Text>
          </Pressable>
        </View>

        {/* Chaves Cadastradas */}
        {chaves.length > 0 && (
          <>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12 }}>
              CHAVES CADASTRADAS ({chaves.length})
            </Text>
            {chaves.map((chave) => (
              <CartaoChave key={chave.id} chave={chave} />
            ))}
          </>
        )}

        {/* Transações Recentes */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>
            Transações Recentes
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
            }}
          >
            <MaterialIcons name="history" size={48} color={colors.muted} />
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginTop: 12 }}>
              Nenhuma transação
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, textAlign: "center" }}>
              As transações aparecerão aqui
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
