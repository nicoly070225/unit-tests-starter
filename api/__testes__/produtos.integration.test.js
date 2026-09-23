const request = require("supertest")
const createApp = require("../app")

describe("API /produtos teste de integracao", () => {
    let app

    beforeEach(() => {
        app = createApp()
    })

    describe('GET /produtos', () => {
        test('retorna 200 e um array com os produtos iniciais', async () => {
            const res = await request(app).get("/produtos")

            expect(res.status).toBe(200)
            expect(Array.isArray(res.body)).toBe(true)
            expect(res.body.length).toBe(3)
        })

        test('retorna 200 e o produto correto ao buscar por ID existente', async () => {
            const res = await request(app).get("/produtos/1")

            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty("id", 1)
        })

        test('retorna 404 com erro ao buscar por ID inexistente', async () => {
            const res = await request(app).get("/produtos/999")

            expect(res.status).toBe(404)
            expect(res.body).toHaveProperty("erro")
        })
    })

    describe('POST /produtos', () => {
        test('deve retornar 201 e o produto criado com id gerado', async () => {
            const novoProduto = { nome: "Mouse Gamer", preco: 120 }
            const res = await request(app).post("/produtos").send(novoProduto)

            expect(res.status).toBe(201)
            expect(res.body).toHaveProperty("id")
            expect(res.body.nome).toBe(novoProduto.nome)
            expect(res.body.preco).toBe(novoProduto.preco)
        })

        test('deve retornar 400 com { erro: ... } quando o nome estiver faltando', async () => {
            const res = await request(app).post("/produtos").send({ preco: 100 })

            expect(res.status).toBe(400)
            expect(res.body).toHaveProperty("erro")
        })

        test('deve retornar 400 com { erro: ... } quando o preco estiver faltando', async () => {
            const res = await request(app).post("/produtos").send({ nome: "Monitor" })

            expect(res.status).toBe(400)
            expect(res.body).toHaveProperty("erro")
        })

        test('o produto criado deve aparecer em uma chamada seguinte a GET /produtos', async () => {
            const novoProduto = { nome: "Headset", preco: 300 }
            const postRes = await request(app).post("/produtos").send(novoProduto)

            const getRes = await request(app).get("/produtos")

            expect(getRes.status).toBe(200)
            expect(getRes.body).toContainEqual(postRes.body)
        })
    })

    describe('DELETE /produtos/:id', () => {
        test('deve retornar 204 quando o produto e removido com sucesso e nao aparecer mais em GET /produtos/:id', async () => {
            const postRes = await request(app)
                .post("/produtos")
                .send({ nome: "Webcam", preco: 150 })

            const id = postRes.body.id

            const deleteRes = await request(app).delete(`/produtos/${id}`)
            expect(deleteRes.status).toBe(204)

            const getRes = await request(app).get(`/produtos/${id}`)
            expect(getRes.status).toBe(404)
        })

        test('deve retornar 404 com { erro: ... } quando o produto nao existir', async () => {
            const res = await request(app).delete("/produtos/99999")

            expect(res.status).toBe(404)
            expect(res.body).toHaveProperty("erro")
        })
    })
})