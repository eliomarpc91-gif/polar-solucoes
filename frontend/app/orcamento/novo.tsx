import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { OrcamentoForm } from "@/components/orcamento-form";
import { saveOrcamento, getNextOrcNumber, generateId, Orcamento } from "@/lib/store";
import { Alert } from "react-native";

export default function NovoOrcamentoScreen() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async (orcamento: Orcamento) => {
    try {
      setIsSaving(true);
      const numero = await getNextOrcNumber();
      const orcamentoComNumero: Orcamento = {
        ...orcamento,
        id: generateId(),
        numero,
        status: orcamento.status || "enviado",
        criadoEm: orcamento.criadoEm || new Date().toISOString(),
        statusPagamento: orcamento.statusPagamento || "pendente",
      };

      await saveOrcamento(orcamentoComNumero);
      Alert.alert("Sucesso", `Orçamento #${numero} criado com sucesso!`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar orçamento. Tente novamente.");
      console.error("Erro ao salvar orçamento:", error);
    } finally {
      setIsSaving(false);
    }
  }, [router]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="p-0">
      <OrcamentoForm
        onSave={handleSave}
        onCancel={handleCancel}
        titulo="Novo Orçamento"
      />
    </ScreenContainer>
  );
}
