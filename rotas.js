const express = require('express');
const { getProdutos} = require('./controladores/produtos');

const rotas = express();

rotas.get('/produtos', getProdutos);
rotas.get('/carrinho');



module.exports = rotas;