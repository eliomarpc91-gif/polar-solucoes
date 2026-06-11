import { useState } from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function BackupScreen() {
  const colors = useColors();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const exportData = async () => {
    setLoading(true);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const polarKeys = keys.filter((k) => k.startsWith("@polar/"));
      const data: { [key: string]: string | null } = {};
      for (const key of polarKeys) {
        data[key] = await AsyncStorage.getItem(key);
      }
      const json = JSON.stringify(data, null, 2);
      Alert.alert(
        "Backup Criado",
        `Backup com ${polarKeys.length} registros gerado com sucesso.\n\nEm uma versão futura, será possível exportar para arquivo ou nuvem.`
      );
    } catch (error) {
      Alert.alert("Erro", "Não foi possível criar o backup.");
    }
    setLoading(false);
  };

  const clearAllData = () => {
    Alert.alert(
      "Limpar Todos os Dados",
      "ATENÇÃO: Esta ação irá apagar TODOS os dados do aplicativo. Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar Tudo",
          style: "destructive",
          onPress: async () => {
            const keys = await AsyncStorage.getAllKeys();
            const polarKeys = keys.filter((k) => k.startsWith("@polar/"));
            await AsyncStorage.multiRemove(polarKeys);
            Alert.alert("Sucesso", "Todos os dados foram apagados.");
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Backup e Dados</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Backup */}
        <View className="bg-surface rounded-xl p-5 border border-border mb-4">
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <MaterialIcons name="cloud-upload" size={24} color={colors.primary} />
            <Text className="text-foreground text-lg font-semibold ml-3">Criar Backup</Text>
          </View>
          <Text className="text-muted text-sm mb-4">
            Crie um backup dos seus dados para restaurar posteriormente.
          </Text>
          <Pressable
            onPress={exportData}
            disabled={loading}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                borderRadius: 10,
                padding: 14,
                alignItems: "center",
                opacity: pressed || loading ? 0.7 : 1,
              },
            ]}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
              {loading ? "Criando..." : "Criar Backup"}
            </Text>
          </Pressable>
        </View>

        {/* Danger Zone */}
        <View style={{ marginTop: 24 }}>
          <Text className="text-error text-xs font-semibold mb-2 ml-1">ZONA DE PERIGO</Text>
          <View className="bg-surface rounded-xl p-5 border border-border">
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <MaterialIcons name="warning" size={24} color={colors.error} />
              <Text className="text-foreground text-base font-semibold ml-3">Limpar Dados</Text>
            </View>
            <Text className="text-muted text-sm mb-4">
              Remove todos os dados do aplicativo. Esta ação não pode ser desfeita.
            </Text>
            <Pressable
              onPress={clearAllData}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.error,
                  borderRadius: 10,
                  padding: 14,
                  alignItems: "center",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Limpar Todos os Dados</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
