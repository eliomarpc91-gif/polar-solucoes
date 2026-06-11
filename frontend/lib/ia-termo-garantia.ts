/**
 * Gerador de Termo de Garantia conforme o Código de Defesa do Consumidor (CDC)
 * Para serviços técnicos (refrigeração, climatização, elétrica, etc).
 *
 * Baseado em:
 * - CDC Art. 26: prazo de reclamação 90 dias para serviços/produtos duráveis
 * - CDC Art. 24: garantia legal mínima obrigatória
 * - CDC Art. 50: garantia contratual (estendida pelo prestador)
 */

import { getEmpresa } from "./store";

export async function gerarTermoGarantiaIA(): Promise<string> {
  const empresa = await getEmpresa();
  const nome = empresa?.nome || "Polar Soluções";

  return `TERMO DE GARANTIA DE PRESTAÇÃO DE SERVIÇOS

A ${nome}, em conformidade com o Código de Defesa do Consumidor (Lei 8.078/90), oferece a este cliente as seguintes condições de garantia:

1. PRAZO DE GARANTIA
A garantia dos serviços executados é de 90 (noventa) dias, contados da data da conclusão do serviço, conforme art. 26, inciso II, do CDC.

2. COBERTURA DA GARANTIA
Estão cobertos:
- Defeitos de execução do serviço prestado;
- Vícios decorrentes da mão de obra empregada;
- Peças instaladas pela ${nome} dentro do prazo de garantia do fabricante.

3. EXCLUSÕES DA GARANTIA
Não estão cobertos:
- Danos causados por mau uso, negligência ou imperícia do usuário;
- Falta de manutenção preventiva recomendada;
- Intervenções de terceiros não autorizados;
- Causas externas (oscilações elétricas, infiltrações, intempéries);
- Componentes não fornecidos pela ${nome};
- Desgaste natural decorrente do uso.

4. ACIONAMENTO DA GARANTIA
Para acionar a garantia, o cliente deve entrar em contato com a ${nome} por meio dos canais oficiais, apresentando este termo e a respectiva nota fiscal/recibo de pagamento.

5. ATENDIMENTO
A ${nome} se compromete a atender o chamado em até 5 (cinco) dias úteis após a comunicação do problema, conforme art. 18, §1º, do CDC.

6. DIREITOS DO CONSUMIDOR
Não obstante esta garantia contratual, ficam assegurados ao cliente todos os direitos previstos no Código de Defesa do Consumidor.

7. ACEITE
A aceitação dos serviços implica concordância com os termos desta garantia.

${nome}
${empresa?.cnpj ? `CNPJ: ${empresa.cnpj}` : ""}
${empresa?.telefone ? `Telefone: ${empresa.telefone}` : ""}`;
}
