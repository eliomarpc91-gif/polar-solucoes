import { useState, useEffect } from "react";
import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { SignaturePad } from "@/components/signature-pad";
import { getEmpresa, saveEmpresa, type EmpresaConfig } from "@/lib/store";

export default function AssinaturaScreen() {
  const colors = useColors();
  const router = useRouter();
  const [assinatura, setAssinatura] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const handleSignatureChange = (signature: string) => {
    console.log("🖊️ handleSignatureChange chamado");
    console.log("  - Assinatura recebida:", signature ? `${signature.substring(0, 50)}...` : "vazia");
    setAssinatura(signature);
    
    if (signature) {
      setStatusMessage("✓ Assinatura capturada com sucesso!");
    } else {
      setStatusMessage("");
    }
  };

  const salvar = async () => {
    console.log("\n📝 === INICIANDO SALVAMENTO ===");
    console.log("  - Assinatura presente:", !!assinatura);
    console.log("  - Tamanho da assinatura:", assinatura.length);

    if (!assinatura) {
      console.log("❌ Erro: Assinatura vazia");
      Alert.alert("Erro", "Por favor, faça uma assinatura antes de salvar");
      return;
    }

    setIsSaving(true);
    setStatusMessage("Salvando...");

    try {
      console.log("1️⃣ Recuperando dados da empresa...");
      let empresa = await getEmpresa();
      console.log("  - Empresa encontrada:", empresa ? "Sim" : "Não");
      
      // Se não existir empresa, criar uma padrão
      if (!empresa) {
        console.log("2️⃣ Criando empresa padrão...");
        empresa = {
          nome: "Minha Empresa",
          cnpj: "",
          telefone: "",
          email: "",
          endereco: "",
          cidade: "",
          estado: "",
          logo: "",
          tecnicoResponsavel: "",
        };
        console.log("  - Empresa criada:", empresa.nome);
      } else {
        console.log("2️⃣ Usando empresa existente:", empresa.nome);
      }
      
      // Salvar com a assinatura
      const empresaAtualizada: EmpresaConfig = {
        ...empresa,
        assinatura,
      };
      
      console.log("3️⃣ Salvando empresa com assinatura...");
      console.log("  - Nome:", empresaAtualizada.nome);
      console.log("  - CNPJ:", empresaAtualizada.cnpj || "(vazio)");
      console.log("  - Assinatura tamanho:", empresaAtualizada.assinatura?.length);
      
      await saveEmpresa(empresaAtualizada);
      console.log("✅ Assinatura salva com sucesso!");
      
      // Verificar se foi realmente salvo
      const verificacao = await getEmpresa();
      console.log("4️⃣ Verificando salvamento...");
      console.log("  - Empresa recuperada:", verificacao?.nome);
      console.log("  - Assinatura recuperada:", verificacao?.assinatura ? "Sim" : "Não");
      
      setStatusMessage("✅ Assinatura salva com sucesso!");
      
      setTimeout(() => {
        Alert.alert("Sucesso", "Assinatura salva com sucesso!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }, 500);
    } catch (error) {
      console.error("❌ Erro ao salvar assinatura:", error);
      setStatusMessage("❌ Erro ao salvar");
      Alert.alert("Erro", "Falha ao salvar assinatura: " + String(error));
    } finally {
      setIsSaving(false);
      console.log("📝 === SALVAMENTO FINALIZADO ===\n");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Assinatura Digital</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text className="text-muted text-sm mb-4">
          Desenhe sua assinatura no espaço abaixo. A assinatura será exibida em todos os orçamentos e ordens de serviço.
        </Text>

        {/* Signature Pad Component */}
        <SignaturePad onSignatureChange={handleSignatureChange} />

        {/* Instructions */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 16, marginTop: 16 }}>
          <Text className="text-foreground font-semibold mb-2">Como usar:</Text>
          <Text className="text-muted text-sm mb-1">• Toque na área acima para desenhar sua assinatura</Text>
          <Text className="text-muted text-sm mb-1">• Use o botão "Limpar" se cometer um erro</Text>
          <Text className="text-muted text-sm">• Toque em "Salvar" para confirmar e voltar</Text>
        </View>

        {/* Status Messages */}
        {statusMessage && (
          <View 
            style={{ 
              backgroundColor: statusMessage.includes("❌") ? colors.error + "20" : colors.success + "20", 
              borderRadius: 12, 
              padding: 12, 
              marginBottom: 16 
            }}
          >
            <Text style={{ 
              color: statusMessage.includes("❌") ? colors.error : colors.success, 
              fontWeight: "600" 
            }}>
              {statusMessage}
            </Text>
          </View>
        )}

        {/* Debug Info */}
        {assinatura && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <Text className="text-foreground font-semibold mb-2">Debug Info:</Text>
            <Text className="text-muted text-xs">Tamanho: {assinatura.length} bytes</Text>
            <Text className="text-muted text-xs">Tipo: {assinatura.substring(0, 30)}...</Text>
          </View>
        )}

        {/* Save Button */}
        <Pressable
          onPress={salvar}
          disabled={isSaving || !assinatura}
          style={({ pressed }) => [
            {
              backgroundColor: assinatura ? colors.primary : colors.muted,
              borderRadius: 12,
              padding: 14,
              alignItems: "center",
              opacity: pressed ? 0.8 : isSaving ? 0.6 : 1,
            },
          ]}
        >
          <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 15 }}>
            {isSaving ? "Salvando..." : assinatura ? "Salvar e Voltar" : "Faça uma assinatura primeiro"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
