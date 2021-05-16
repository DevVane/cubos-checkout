const {produtos} = require("../dados/data.json"); //importando produtos do estoque


const emEstoque = produtos.filter(produto => produto.estoque > 0); //filtrando apenas os elementos que tem pelo menos 1 unidade do produto

function getProdutos(req, res ){
    const categoria = req.query.categoria;
    const precoInicial = Number(req.query.precoInicial);
    const precoFinal = Number(req.query.precoFinal);

    if(precoInicial && precoFinal && categoria){
        const filtrarCategoria = emEstoque.filter(produto => produto.categoria.toLowerCase() === categoria.toLowerCase());
        const filtrarCategPreco = filtrarCategoria.filter(produto => (produto.preco >= precoInicial && produto.preco <= precoFinal));
    
        res.status(200).json(filtrarCategPreco);
        return;
    }

    if(categoria){
        const filtrarCategoria = emEstoque.filter(produto => produto.categoria.toLowerCase() === categoria.toLowerCase()); //filtrando por categoria apenas os que tiverem unidades no estoque 
        
        res.status(200).json(filtrarCategoria);
        return;
    }

    if(precoInicial && precoFinal){
        const filtrarPreco = emEstoque.filter(produto => (produto.preco >= precoInicial && produto.preco <= precoFinal)); //filtrando pela faixa de preço

        res.status(200).json(filtrarPreco);
        return;
    } 

    res.status(200); //ok
    res.json(produtos); //mostrando todo os produtos
}

module.exports = {
    getProdutos
};