import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page, request }) => {
  const resposta = await request.post("http://localhost:3000/__reset");
  expect(resposta.status()).toBe(204);
  await page.goto("/");
  // A pagina inicial e a de Produtos: troca para a aba Pedidos
  await page.getByRole("button", { name: "Pedidos" }).click();
  await expect(page.getByRole("button", { name: "Pedidos" })).toBeDisabled();

  // A tela depende de 3 fontes de dados: espera tudo carregar
  await expect(page.getByLabel("Cliente")).toContainText("Ana Souza");
  await expect(page.getByLabel("Produto")).toContainText("Coxinha");
  await expect(page.getByRole("row")).toHaveCount(2); // cabecalho + pedido #1
});

// Funcao auxiliar: escolhe produto, quantidade e clica em "Adicionar item"
async function adicionarItem(page, produto, quantidade = 1) {
  await page.getByLabel("Produto").selectOption({ label: produto });
  await page.getByLabel("Quantidade").fill(String(quantidade));
  await page.getByRole("button", { name: "Adicionar item" }).click();
}

// P1
test("lista os pedidos iniciais", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible();

  const linha = page.getByRole("row", { name: /Ana Souza/ });
  await expect(linha.getByRole("cell", { name: "1", exact: true })).toBeVisible();
  await expect(linha.getByRole("cell", { name: "Ana Souza" })).toBeVisible();
  await expect(linha.getByRole("cell", { name: "2x Coxinha" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "R$ 10,00" })).toBeVisible();
  await expect(page.getByLabel("Status do pedido 1")).toHaveValue("pendente");
});

// P2
test("monta um pedido com um item", async ({ page }) => {
  await page.getByLabel("Cliente").selectOption("Bruno Lima");
  await page.getByLabel("Produto").selectOption({ label: "Pastel" });
  await expect(page.getByLabel("Quantidade")).toHaveValue("1");
  await page.getByRole("button", { name: "Adicionar item" }).click();

  // Lista de itens antes de criar
  await expect(page.getByRole("listitem")).toHaveText(["1x Pastel"]);

  await page.getByRole("button", { name: "Criar pedido" }).click();

  const linha = page.getByRole("row", { name: /Bruno Lima/ });
  await expect(linha).toBeVisible();
  await expect(linha).toContainText("1x Pastel");
  await expect(linha).toContainText("R$ 8,00");
  await expect(linha.getByRole("combobox")).toHaveValue("pendente");
  await expect(page.getByRole("row")).toHaveCount(3);

  // Cliente e lista de itens limpos
  await expect(page.getByLabel("Cliente")).toHaveValue("");
  await expect(page.getByRole("listitem")).toHaveCount(0);
});

// P3
test("monta um pedido com varios itens e quantidades", async ({ page }) => {
  await page.getByLabel("Cliente").selectOption("Ana Souza");
  await adicionarItem(page, "Coxinha", 3);
  await adicionarItem(page, "Empada", 1);
  await expect(page.getByRole("listitem")).toHaveText(["3x Coxinha", "1x Empada"]);

  await page.getByRole("button", { name: "Criar pedido" }).click();

  // Total calculado pela API: 3 x 5 + 1 x 6 = 21
  const linha = page.getByRole("row", { name: /3x Coxinha, 1x Empada/ });
  await expect(linha).toBeVisible();
  await expect(linha.getByRole("cell", { name: "R$ 21,00" })).toBeVisible();
});

// P4
test("quantidade volta a 1 depois de adicionar um item", async ({ page }) => {
  await page.getByLabel("Produto").selectOption({ label: "Coxinha" });
  await page.getByLabel("Quantidade").fill("5");
  await expect(page.getByLabel("Quantidade")).toHaveValue("5");

  await page.getByRole("button", { name: "Adicionar item" }).click();

  await expect(page.getByRole("listitem")).toHaveText(["5x Coxinha"]);
  await expect(page.getByLabel("Quantidade")).toHaveValue("1");
});

// P5
test("nao cria pedido sem cliente", async ({ page }) => {
  await adicionarItem(page, "Pastel");
  await page.getByRole("button", { name: "Criar pedido" }).click();

  await expect(page.getByText("Cliente e obrigatorio")).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(2); // nenhuma linha nova
});

// P6
test("nao cria pedido sem itens", async ({ page }) => {
  await page.getByLabel("Cliente").selectOption("Bruno Lima");
  await page.getByRole("button", { name: "Criar pedido" }).click();

  await expect(page.getByText("Pedido deve ter ao menos um item")).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(2);
});

// P7
test("altera o status de um pedido", async ({ page }) => {
  const status = page.getByLabel("Status do pedido 1");
  await status.selectOption("pago");
  await expect(status).toHaveValue("pago");

  // Confirma que foi salvo no servidor: recarrega e volta na aba
  await page.reload();
  await page.getByRole("button", { name: "Pedidos" }).click();
  await expect(page.getByLabel("Status do pedido 1")).toHaveValue("pago");
});

// P8
test("pedido cancelado nao pode ser alterado", async ({ page }) => {
  const status = page.getByLabel("Status do pedido 1");
  await status.selectOption("cancelado");
  await expect(status).toHaveValue("cancelado");

  await status.selectOption("pago");

  await expect(page.getByText("Pedido cancelado nao pode ser alterado")).toBeVisible();
  // O select e controlado pelo estado: continua mostrando o valor do servidor
  await expect(status).toHaveValue("cancelado");
});

// P9
test("remove um pedido", async ({ page }) => {
  const linha = page.getByRole("row", { name: /Ana Souza/ });
  await linha.getByRole("button", { name: "Remover" }).click();

  await expect(linha).toHaveCount(0);
  await expect(page.getByRole("row")).toHaveCount(1); // so o cabecalho
});

// P10 (desafio)
test("ciclo completo do pedido", async ({ page }) => {
  // Criar pedido para Bruno Lima com 2x Empada
  await page.getByLabel("Cliente").selectOption("Bruno Lima");
  await adicionarItem(page, "Empada", 2);
  await page.getByRole("button", { name: "Criar pedido" }).click();

  const linha = page.getByRole("row", { name: /Bruno Lima/ });
  await expect(linha).toContainText("2x Empada");
  await expect(linha).toContainText("R$ 12,00");
  const status = page.getByLabel("Status do pedido 2");
  await expect(status).toHaveValue("pendente");

  // Marcar como pago
  await status.selectOption("pago");
  await expect(status).toHaveValue("pago");
  await expect(page.locator("p.erro")).toHaveCount(0);

  // Cancelar (pago -> cancelado e permitido)
  await status.selectOption("cancelado");
  await expect(status).toHaveValue("cancelado");
  await expect(page.locator("p.erro")).toHaveCount(0);

  // Tentar voltar para pendente: deve dar erro
  await status.selectOption("pendente");
  await expect(page.getByText("Pedido cancelado nao pode ser alterado")).toBeVisible();
  await expect(status).toHaveValue("cancelado");

  // Remover
  await linha.getByRole("button", { name: "Remover" }).click();
  await expect(linha).toHaveCount(0);
  await expect(page.getByRole("row")).toHaveCount(2); // cabecalho + pedido #1
});