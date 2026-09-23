const ProdutoService = require("../services/ProdutoService")

describe('ProdutoService - Testes Unitarios com Mocks', () => {
    let service
    let mockRepository

    beforeEach(() => {
        mockRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            delete: jest.fn()
        }
        service = new ProdutoService(mockRepository)
    })

    describe("Listar", () => {
        test('chama repository.findAll uma vez e retorna o resultado', () => {
            const produtos = [{ id: 1, nome: "Coxinha", preco: 5 }]
            mockRepository.findAll.mockReturnValue(produtos)

            const resultado = service.listar()

            expect(mockRepository.findAll).toHaveBeenCalledTimes(1)
            expect(resultado).toEqual(produtos)
        })
    })

    describe("buscarPorId", () => {
        test('chama repository.findById com o id correto e retorna o produto', () => {
            const produto = { id: 1, nome: "Coxinha", preco: 5 }
            mockRepository.findById.mockReturnValue(produto)

            const resultado = service.buscarPorId(1)

            expect(mockRepository.findById).toHaveBeenCalledWith(1)
            expect(resultado).toEqual(produto)
        })

        test('lanca erro "Produto nao encontrado" quando o produto nao existir', () => {
            mockRepository.findById.mockReturnValue(null)

            expect(() => service.buscarPorId(999)).toThrow('Produto nao encontrado')
            expect(mockRepository.findById).toHaveBeenCalledWith(999)
        })
    })

    describe("criar", () => {
        test('deve repassar dados para mockRepository.create e retornar o produto criado', () => {
            const dados = { nome: "Empada", preco: 6 }
            const produtoCriado = { id: 2, ...dados }
            mockRepository.create.mockReturnValue(produtoCriado)

            const resultado = service.criar(dados)

            expect(mockRepository.create).toHaveBeenCalledWith(dados)
            expect(resultado).toEqual(produtoCriado)
        })

        test('deve propagar o erro lancado pelo repository quando os dados forem invalidos', () => {
            const dadosInvalidos = { nome: "" }
            mockRepository.create.mockImplementation(() => {
                throw new Error("Dados invalidos")
            })

            expect(() => service.criar(dadosInvalidos)).toThrow("Dados invalidos")
        })
    })

    describe("remover", () => {
        test('deve chamar mockRepository.delete com o id correto quando o produto existe', () => {
            mockRepository.delete.mockReturnValue(true)

            expect(() => service.remover(1)).not.toThrow()
            expect(mockRepository.delete).toHaveBeenCalledWith(1)
        })

        test('deve lancar erro "Produto nao encontrado" quando o repository retornar false', () => {
            mockRepository.delete.mockReturnValue(false)

            expect(() => service.remover(999)).toThrow('Produto nao encontrado')
            expect(mockRepository.delete).toHaveBeenCalledWith(999)
        })
    })
})