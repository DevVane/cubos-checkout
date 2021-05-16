const {produtos} = require("../dados/data.json"); //importando produtos do estoque
const {addBusinessDays} = require('date-fns') //importando metodo da biblioteca date-fns
const fs = require('fs/promises');


const emEstoque = produtos.filter(produto => produto.estoque > 0); //filtrando apenas os elementos que tem pelo menos 1 unidade do produto


let subtotal = 0;
let dataEntrega = null;
let frete = 0;
let totalPagar = 0;
let produtosNoCarrinho = [];

let carrinho = {
    subtotal: subtotal,
    dataDeEntrega: dataEntrega,
    valorDoFrete: frete,
    totalAPagar: totalPagar, 
    produtos: produtosNoCarrinho
}

function calcularCarrinho(carrinho){
    if(carrinho.produtos.length === 0){
        subtotal = 0, dataEntrega = null, frete = 0, totalPagar = 0;
        console.log("carrinho vazio");
    }else{
        subtotal = 0; //zero o subtotal anterior caso já tinha algo
        for(let produto of carrinho.produtos){
            subtotal += produto.quantidade * produto.preco; //calculo o subtotal

        }
        if(subtotal < 20000){ //compras abaixo de 200 reais pagam 50 reais de frete
            frete = 5000;   
        }
        totalPagar = frete+subtotal;
        dataEntrega = addBusinessDays(new Date(), 15);
    }
    carrinho.subtotal = subtotal;
    carrinho.valorDoFrete = frete;
    carrinho.totalAPagar = totalPagar;
    carrinho.dataDeEntrega = dataEntrega;
    //console.log("Calculando carrinho"); 
    return;
}

function detalharCarrinho(req, res){
    calcularCarrinho(carrinho);

    res.status(200).json(carrinho);
}

function addAoCarrinho(req, res){
    const {id: idProduto, quantidade} = req.body;
    
    if(idProduto && quantidade){
        const produto = emEstoque.find(produto => (produto.id === idProduto && produto.estoque >= quantidade)); //procurando se no estoque há o produto buscado e na qtd suficiente
        if(produto){
            const produtoNoCarrinhoIndex = carrinho.produtos.findIndex(produto => produto.id === idProduto);
            if(produtoNoCarrinhoIndex !== -1){
                carrinho.produtos[produtoNoCarrinhoIndex].quantidade += quantidade;
                
                calcularCarrinho(carrinho);
                res.status(200).json(carrinho);
                return;
            }
            produtoNoCarrinho = {
                id: produto.id,
                quantidade: quantidade,
                nome: produto.nome,
                preco: produto.preco,
                categoria: produto.categoria,
            };

            carrinho.produtos.push(produtoNoCarrinho);
            calcularCarrinho(carrinho);

            res.status(200).json(carrinho);
            return;
        }
        res.json({mensagem: "Desculpe, não temos a quantidade solicitada"});
        return;
    }
    res.send("erro");
}

function editarQtdNoCarrinho(req, res){
    const idProduto = Number(req.params.idProduto); 
    const {quantidade} = req.body;

    if(idProduto && quantidade){
        const produtoEncontrado = produtos.find(produto => produto.id === idProduto);
        
        if(!produtoEncontrado){
            res.status(404).json({erro: "Produto não encontrado no estoque"});
            return;
        }
        const produtoPraEditar = carrinho.produtos.find(produto => produto.id === idProduto);
        const produtoPraEditarIndex = carrinho.produtos.findIndex(produto => produto.id === idProduto);
        
        if(!produtoPraEditar){
            res.status(404).json({erro: "O produto ainda não foi adicionado ao carrinho"});
            return;
        }
        const {quantidade: qtdNoCarrinho} = produtoPraEditar;
        const novaQuantidade = qtdNoCarrinho + quantidade;

        
        const produtoEmQtdSuficiente = emEstoque.find(produto => (produto.id === idProduto && produto.estoque >= novaQuantidade)); //procurando se no estoque há o produto buscado e na qtd suficiente
        if(!produtoEmQtdSuficiente){
            res.json({erro: "Desculpe, não temos a quantidade solicitada"});
            return;
        }
    
        if(novaQuantidade < 0){
            res.json({erro: "Desculpe, a quantidade a ser removida não pode ser superior aos itens já adicionados"});
            return;
        }

        carrinho.produtos[produtoPraEditarIndex].quantidade = novaQuantidade;
        
        console.log("Quantidade alterada com sucesso");
        calcularCarrinho(carrinho);

        res.status(200).json(carrinho);
        console.log(carrinho.produtos[produtoPraEditarIndex], novaQuantidade);
        return;
        

    }
    res.send("erro");
}

function excluirProdutoDoCarrinho(req, res){
    const idProduto = Number(req.params.idProduto); 
    
    if(idProduto){
        const produtoEncontradoIndex = carrinho.produtos.findIndex(produto => produto.id === idProduto);
        if(produtoEncontradoIndex === -1){
            res.status(404).json({erro: "O produto não está no carrinho"});
            return;
        }
        carrinho.produtos.splice(produtoEncontradoIndex, 1);
        calcularCarrinho(carrinho);
        res.status(200).json(carrinho);
        return;
        //console.log("Produto excluido");
    }
    res.send("erro");
}

function limparCarrinho(carrinho){
    carrinho.produtos.splice(0);
    calcularCarrinho(carrinho);

    //console.log("Todos os produtos foram excluidos!");
}

function deleteLimparCarrinho(req, res){
    limparCarrinho(carrinho);
    res.status(200).json(carrinho);
}

async function finalizarCompra(req, res){
    if(carrinho.produtos.length === 0){
        res.status(404).json({mensagem: "O carrinho está vazio!"})
        return;
    }
    
    const {type: tipoComprador, country, name, documents} = req.body;

    if(tipoComprador !== 'individual'){
        res.status(400).json({mensagem: "Só vendemos para pessoas físicas (individual)"});
        return;
    }
    if(typeof country !== 'string' || country.length !== 2){
        res.status(400).json({mensagem: "O país deve ser abreviado (ter apenas 2 caracteres)"});
        return;
    }
    if(documents[0].type.toLowerCase() !== 'cpf' ){
        res.status(400).json({mensagem: "Desculpe, recomendamos que utilize o seu cpf"});
        return; 
    }
    if(documents[0].number.length !== 11 || isNaN(Number(documents[0].number))){
        res.status(400).json({mensagem: "Forneça um número de cpf válido (apenas números e com 11 digitos"});
        return;
    }
    if(typeof name !== 'string' || name.split(" ").length < 2){
        res.status(400).json({mensagem: "Forneça nome e sobrenome"});
        return;
    }
    
    for(let produto of carrinho.produtos){
        const {quantidade: quantidadePraRemover, id} = produto; //qtd e id do produto a ser comprado
        if(emEstoque.find(produto => (produto.id === id && produto.estoque < quantidadePraRemover))){
            res.json({mensagem: "Desculpe, não temos a quantidade solicitada"});
            return;
        }

        let produtoAbatido = emEstoque.find(produto => produto.id === id);
        produtoAbatido.estoque -= quantidadePraRemover;
        //console.log(produtoAbatido);

        let estoquePosVenda = [];
        estoquePosVenda = produtos.map((produto) => produto.id === id ? produtoAbatido : produto);
        estoquePosVenda = {produtos: [...estoquePosVenda]};
        console.log(estoquePosVenda);

        await fs.writeFile("./dados/data.json", JSON.stringify(estoquePosVenda, null, 2));  //sobreescrevendo o arquivo com os novos dados
        
    }
    calcularCarrinho(carrinho);
    res.json({mensagem: "Compra efetuada com sucesso!", carrinho: carrinho});

    limparCarrinho(carrinho);

}

module.exports = {
    detalharCarrinho,
    addAoCarrinho,
    editarQtdNoCarrinho, 
    excluirProdutoDoCarrinho,
    deleteLimparCarrinho,
    finalizarCompra
};