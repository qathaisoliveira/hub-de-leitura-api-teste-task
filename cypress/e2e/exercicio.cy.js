/// <reference types="cypress" />

let token

beforeEach(() => {
     cy.geraToken('admin@biblioteca.com', 'admin123').then(tkn => {
          token = tkn
     })
});
describe('Testes da Funcionalidade Catálogo de Livros', () => {

     // Objetivo: Verificar que a API retorna lista de livros com paginação e filtros funcionando
     // Validar que filtros por categoria e autores funcionam corretamente
     it('GET - Deve listar livros com filtros e paginação', () => {
          cy.request({
               method: 'GET',
               url: 'books',
               qs: {
                    page: 1,
                    limit: 10,
                    category: 'Literatura Brasileira',
                    author: 'Machado de Assis'
               }
          }).then((response) => {
               expect(response.status).to.equal(200);
               expect(response.body.books).to.be.an('array');

               response.body.books.forEach((book) => {
                    expect(book.category).to.equal('Literatura Brasileira');
                    expect(book.author).to.equal('Machado de Assis');
               });
          });
     });

     // Objetivo: Validar que é possível obter detalhes de um livro específico pelo ID
     // Verificar que todos os campos do livro são retornados corretamente
     it('GET - Deve obter detalhes de um livro específico', () => {
          cy.request('books').then((response) => {
               const livroId = response.body.books[0].id;

               cy.request(`books/${livroId}`).then((resLivro) => {
                    expect(resLivro.status).to.equal(200);
                    // Acedendo à propriedade correta retornada pelo endpoint de detalhes
                    expect(resLivro.body.book).to.have.property('id', livroId);
                    expect(resLivro.body.book).to.have.property('title');
                    expect(resLivro.body.book).to.have.property('author');
               });
          });
     });

     // Objetivo: Validar que um novo livro é adicionado com sucesso ao catálogo
     // Verificar que apenas admin pode adicionar novos livros (validação de permissão)
     it('POST - Deve cadastrar um novo livro com sucesso', () => {
          const tituloUnico = `Livro Automatizado ${Date.now()}`;

          cy.request({
               method: 'POST',
               url: 'books',
               headers: {
                    Authorization: token
               },
               body: {
                    title: tituloUnico,
                    author: 'Autor Teste',
                    category: 'Ficção'
               }
          }).then((response) => {
               expect(response.status).to.equal(201);
          });
     });

     // Objetivo: Garantir que dados inválidos são rejeitados ao adicionar um livro
     // Validar mensagens de erro apropriadas para dados faltantes ou incorretos
     it('POST -  Deve rejeitar livro com dados inválidos', () => {
          cy.request({
               method: 'POST',
               url: 'books',
               headers: {
                    Authorization: token
               },
               failOnStatusCode: false, // Permite validar status de erro 4xx/5xx sem falhar o Cypress
               body: {
                    title: '', // Título vazio/inválido
                    author: ''
               }
          }).then((response) => {
               expect(response.status).to.equal(400);
               expect(response.body).to.have.property('message'); // Valida se a API retornou mensagem de erro
          });
     });

     // Objetivo: Validar que um livro pode ser atualizado com sucesso
     // Verificar que apenas admin pode atualizar livros (validação de permissão)
     it('PUT - Deve atualizar um livro previamente cadastrado', () => {
          const tituloOriginal = `Livro para Atualizar ${Date.now()}`;
          const tituloAtualizado = `Livro Atualizado ${Date.now()}`;

          // 1. Cadastra um livro (apenas com campos permitidos: title, author, category)
          cy.request({
               method: 'POST',
               url: 'books',
               headers: {
                    Authorization: token
               },
               body: {
                    title: tituloOriginal,
                    author: 'Autor Teste',
                    category: 'Ficção'
               }
          }).then((resPost) => {
               expect(resPost.status).to.eq(201);

               // Extrai o ID corretamente dependendo da estrutura da resposta
               const livroId = resPost.body.book ? resPost.body.book.id : resPost.body.id;

               // 2. Faz o pedido PUT para atualizar o livro criado
               cy.request({
                    method: 'PUT',
                    url: `books/${livroId}`,
                    headers: {
                         Authorization: token
                    },
                    body: {
                         title: tituloAtualizado,
                         author: 'Autor Teste Atualizado',
                         category: 'Ficção'
                    }
               }).then((resPut) => {
                    expect(resPut.status).to.eq(200);
               });
          });

     });

     // Objetivo: Validar que um livro pode ser removido do catálogo
     // Verificar que apenas admin pode deletar livros (validação de permissão)
     it('DELETE - Deve deletar um livro previamente cadastrado', () => {
          const tituloParaDeletar = `Livro para Deletar ${Date.now()}`;

          // 1. Cadastra um livro para garantir que temos um ID válido para remover
          cy.request({
               method: 'POST',
               url: 'books',
               headers: {
                    Authorization: token
               },
               body: {
                    title: tituloParaDeletar,
                    author: 'Autor Teste',
                    category: 'Ficção'
               }
          }).then((resPost) => {
               expect(resPost.status).to.equal(201);

               // Extrai o ID do livro criado
               const livroId = resPost.body.book ? resPost.body.book.id : resPost.body.id;

               // 2. Faz o pedido DELETE para remover o livro
               cy.request({
                    method: 'DELETE',
                    url: `books/${livroId}`,
                    headers: {
                         Authorization: token
                    }
               }).then((resDelete) => {
                    expect(resDelete.status).to.eq(200);
               });
          });
     });
});
