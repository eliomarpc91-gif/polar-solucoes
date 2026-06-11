import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { InputField } from "@/components/input-field";
import { getEmpresa, saveEmpresa, EmpresaConfig } from "@/lib/store";

export default function ConfiguracoesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [empresa, setEmpresa] = useState<EmpresaConfig>({
    nome: "",
    cnpj: "",
    telefone: "",
    email: "",
    endereco: "",
    cidade: "",
    estado: "",
    logo: "",
    tecnicoResponsavel: "",
    assinatura: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getEmpresa();
    if (data) setEmpresa(data);
  };

  const salvar = async () => {
    await saveEmpresa(empresa);
    Alert.alert("Sucesso", "Configurações salvas com sucesso!");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Configurações</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          keyboardShouldPersistTaps="always"
          scrollEnabled={true}
        >
          <Text className="text-foreground text-lg font-semibold mb-4">Dados da Empresa</Text>

          <InputField
            label="NOME DA EMPRESA"
            value={empresa.nome}
            onChangeText={(t) => setEmpresa({ ...empresa, nome: t })}
            placeholder="Nome da empresa"
          />
          <InputField
            label="CNPJ"
            value={empresa.cnpj}
            onChangeText={(t) => setEmpresa({ ...empresa, cnpj: t })}
            placeholder="00.000.000/0000-00"
          />
          <InputField
            label="TELEFONE"
            value={empresa.telefone}
            onChangeText={(t) => setEmpresa({ ...empresa, telefone: t })}
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
          />
          <InputField
            label="EMAIL"
            value={empresa.email}
            onChangeText={(t) => setEmpresa({ ...empresa, email: t })}
            placeholder="email@empresa.com"
            keyboardType="email-address"
          />
          <InputField
            label="ENDEREÇO"
            value={empresa.endereco}
            onChangeText={(t) => setEmpresa({ ...empresa, endereco: t })}
            placeholder="Rua, número, bairro"
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 2 }}>
              <InputField
                label="CIDADE"
                value={empresa.cidade}
                onChangeText={(t) => setEmpresa({ ...empresa, cidade: t })}
                placeholder="Cidade"
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="ESTADO"
                value={empresa.estado}
                onChangeText={(t) => setEmpresa({ ...empresa, estado: t })}
                placeholder="UF"
              />
            </View>
          </View>

          {/* Técnico Responsável */}
          <Text className="text-foreground text-lg font-semibold mb-4 mt-6">Técnico Responsável</Text>
          <InputField
            label="NOME DO TÉCNICO"
            value={empresa.tecnicoResponsavel || ""}
            onChangeText={(t) => setEmpresa({ ...empresa, tecnicoResponsavel: t })}
            placeholder="Nome completo do técnico"
          />
          <InputField
            label="REGISTRO PROFISSIONAL"
            value={empresa.registroProfissional || ""}
            onChangeText={(t) => setEmpresa({ ...empresa, registroProfissional: t })}
            placeholder="Ex: CREA-XX 12345, MTE 0001"
          />

          {/* Termo de Garantia */}
          <Text className="text-foreground text-lg font-semibold mb-2 mt-6">Termo de Garantia</Text>
          <Text className="text-muted text-xs mb-3">
            Este texto aparece em todo PDF de orçamento e recibo. Você pode personalizar ou usar a IA pra gerar um termo conforme o CDC.
          </Text>
          <TouchableOpacity
            onPress={async () => {
              try {
                const { gerarTermoGarantiaIA } = await import("@/lib/ia-termo-garantia");
                const termo = await gerarTermoGarantiaIA();
                setEmpresa({ ...empresa, termoGarantia: termo });
                Alert.alert("Termo gerado", "Termo de garantia gerado pela IA conforme o CDC. Você pode editar livremente.");
              } catch (e: any) {
                Alert.alert("Erro", e?.message || "Não foi possível gerar o termo");
              }
            }}
            style={{
              backgroundColor: colors.primary,
              padding: 12,
              borderRadius: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginBottom: 10,
            }}
            testID="btn-gerar-termo-ia"
          >
            <MaterialIcons name="auto-awesome" size={16} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Gerar com IA (conforme CDC)</Text>
          </TouchableOpacity>
          <TextInput
            value={empresa.termoGarantia || ""}
            onChangeText={(t) => setEmpresa({ ...empresa, termoGarantia: t })}
            placeholder="Ex: Garantia de 90 dias contra defeitos de execução..."
            placeholderTextColor={colors.muted}
            multiline
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 14,
              color: colors.foreground,
              minHeight: 140,
              textAlignVertical: "top",
              marginBottom: 14,
            }}
            testID="empresa-termo-garantia"
          />

          {/* Meta financeira */}
          <Text className="text-foreground text-lg font-semibold mb-4 mt-6">Meta Mensal</Text>
          <InputField
            label="META DE FATURAMENTO (R$)"
            value={empresa.metaMensal ? empresa.metaMensal.toString() : ""}
            onChangeText={(t) =>
              setEmpresa({
                ...empresa,
                metaMensal: parseFloat(t.replace(",", ".")) || 0,
              })
            }
            placeholder="Ex: 15000"
            keyboardType="decimal-pad"
          />

          {/* Assinatura */}
          <Text className="text-foreground text-lg font-semibold mb-4 mt-6">Assinatura Digital</Text>
          <Text className="text-muted text-sm mb-3">A assinatura será exibida nos orçamentos e ordens de serviço</Text>
          <Pressable
            onPress={() => router.push("/assinatura")}
            style={({ pressed }) => [
              {
                backgroundColor: colors.surface,
                borderWidth: 2,
                borderColor: colors.primary,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 120,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {empresa.assinatura ? (
              <View>
                <Text className="text-foreground font-semibold mb-2">Assinatura Registrada</Text>
                <Text className="text-muted text-xs">Toque para alterar</Text>
              </View>
            ) : (
              <View style={{ alignItems: "center" }}>
                <MaterialIcons name="edit" size={32} color={colors.primary} />
                <Text className="text-primary font-semibold mt-2">Adicionar Assinatura</Text>
              </View>
            )}
          </Pressable>

          {/* Save Button */}
          <Pressable
            onPress={salvar}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                marginTop: 16,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold" }}>Salvar Configurações</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
