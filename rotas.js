const express = require('express');
const { getProdutos, 
        detalharCarrinho, 
        addAoCarrinho, 
        editarQtdNoCarrinho, 
        excluirProdutoDoCarrinho,
        deleteLimparCarrinho,
        finalizarCompra} = require('./controladores/produtos');

const rotas = express();

rotas.get('/produtos', getProdutos);
rotas.get('/carrinho', detalharCarrinho);
rotas.post('/carrinho/produtos', addAoCarrinho);
rotas.patch('/carrinho/produtos/:idProduto', editarQtdNoCarrinho);
rotas.delete('/carrinho/produtos/:idProduto', excluirProdutoDoCarrinho);
rotas.delete('/carrinho', deleteLimparCarrinho);
rotas.post('/finalizar-compra', finalizarCompra);


module.exports = rotas;