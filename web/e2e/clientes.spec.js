import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page, request }) => {
  const resposta = await request.post("http://localhost:3000/__reset");
  expect(resposta.status()).toBe(204);
  await page.goto("/");
  // A pagina inicial e a de Produtos: troca para a aba Clientes
  await page.getByRole("button", { name: "Clientes" }).click();
  // O botao da aba atual fica desabilitado
  await expect(page.getByRole("button", { name: "Clientes" })).toBeDisabled();
});

// C1
test("lista os clientes iniciais", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(3); // cabecalho + 2 clientes
  await expect(page.getByRole("cell", { name: "Ana Souza" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Bruno Lima" })).toBeVisible();
});

// C2
test("cadastra um cliente novo", async ({ page }) => {
  await page.getByLabel("Nome").fill("Carla Dias");
  await page.getByLabel("Email").fill("carla@email.com");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  const linha = page.getByRole("row", { name: /Carla Dias/ });
  await expect(linha).toBeVisible();
  await expect(linha).toContainText("carla@email.com");
  await expect(page.getByRole("row")).toHaveCount(4);

  // Campos voltam a ficar vazios
  await expect(page.getByLabel("Nome")).toHaveValue("");
  await expect(page.getByLabel("Email")).toHaveValue("");
});

// C3
test("mostra erro ao cadastrar sem preencher os campos", async ({ page }) => {
  await expect(page.getByRole("row")).toHaveCount(3);
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await expect(page.getByText("Nome e email sao obrigatorios")).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(3); // continuam 2 clientes
});

// C4
test("impede cadastro com email duplicado", async ({ page }) => {
  await expect(page.getByRole("row")).toHaveCount(3);
  await page.getByLabel("Nome").fill("Teste");
  await page.getByLabel("Email").fill("ana@email.com");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await expect(page.getByText("Email ja cadastrado")).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(3);
  await expect(page.getByRole("cell", { name: "Teste" })).toHaveCount(0);
});

// C5
test("edita um cliente", async ({ page }) => {
  const linhaBruno = page.getByRole("row", { name: /Bruno Lima/ });
  await linhaBruno.getByRole("button", { name: "Editar" }).click();

  // Formulario preenchido com os dados do cliente
  await expect(page.getByLabel("Nome")).toHaveValue("Bruno Lima");
  await expect(page.getByLabel("Email")).toHaveValue("bruno@email.com");

  // Em modo de edicao: "Salvar" no lugar de "Cadastrar" e botao "Cancelar"
  await expect(page.getByRole("button", { name: "Salvar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cadastrar" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Cancelar" })).toBeVisible();

  await page.getByLabel("Nome").fill("Bruno Lima Silva");
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page.getByRole("cell", { name: "Bruno Lima Silva" })).toBeVisible();
  await expect(page.getByRole("row", { name: /Bruno Lima Silva/ })).toContainText("bruno@email.com");

  // Volta ao modo de cadastro e formulario limpo
  await expect(page.getByRole("button", { name: "Cancelar" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Cadastrar" })).toBeVisible();
  await expect(page.getByLabel("Nome")).toHaveValue("");
  await expect(page.getByLabel("Email")).toHaveValue("");
});

// C6
test("cancela a edicao sem salvar", async ({ page }) => {
  const linhaAna = page.getByRole("row", { name: /Ana Souza/ });
  await linhaAna.getByRole("button", { name: "Editar" }).click();
  await expect(page.getByLabel("Nome")).toHaveValue("Ana Souza");

  await page.getByLabel("Nome").fill("Ana Alterada");
  await page.getByRole("button", { name: "Cancelar" }).click();

  await expect(page.getByLabel("Nome")).toHaveValue("");
  await expect(page.getByLabel("Email")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Cadastrar" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Ana Souza" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Ana Alterada" })).toHaveCount(0);
});

// C7
test("nao permite editar para um email ja usado", async ({ page }) => {
  const linhaBruno = page.getByRole("row", { name: /Bruno Lima/ });
  await linhaBruno.getByRole("button", { name: "Editar" }).click();
  await expect(page.getByLabel("Email")).toHaveValue("bruno@email.com");

  await page.getByLabel("Email").fill("ana@email.com");
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page.getByText("Email ja cadastrado")).toBeVisible();
  await expect(linhaBruno).toContainText("bruno@email.com");
  await expect(linhaBruno).not.toContainText("ana@email.com");
});

// C8
test("remove um cliente", async ({ page }) => {
  const linhaBruno = page.getByRole("row", { name: /Bruno/ });
  await linhaBruno.getByRole("button", { name: "Remover" }).click();

  await expect(linhaBruno).toHaveCount(0);
  await expect(page.getByRole("row")).toHaveCount(2); // cabecalho + 1 cliente
});

// C9 (desafio)
test("fluxo completo: cadastrar, editar, duplicar email e remover", async ({ page }) => {
  // Cadastrar
  await page.getByLabel("Nome").fill("Diego");
  await page.getByLabel("Email").fill("diego@email.com");
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await expect(page.getByRole("cell", { name: "Diego", exact: true })).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(4);

  // Editar o nome
  await page.getByRole("row", { name: /Diego/ }).getByRole("button", { name: "Editar" }).click();
  await expect(page.getByLabel("Nome")).toHaveValue("Diego");
  await page.getByLabel("Nome").fill("Diego Matos");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("cell", { name: "Diego Matos" })).toBeVisible();

  // Tentar cadastrar outro cliente com o mesmo email
  await page.getByLabel("Nome").fill("Outro Diego");
  await page.getByLabel("Email").fill("diego@email.com");
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await expect(page.getByText("Email ja cadastrado")).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(4);

  // Remover Diego Matos
  const linhaDiego = page.getByRole("row", { name: /Diego Matos/ });
  await linhaDiego.getByRole("button", { name: "Remover" }).click();
  await expect(linhaDiego).toHaveCount(0);

  // Contagem final: cabecalho + Ana + Bruno
  await expect(page.getByRole("row")).toHaveCount(3);
});