// Consts
const express = require ('express')
const router = express.Router()
const mongoose = require('mongoose')
const { createGzip } = require('zlib')
require("../models/Categoria")
const Categoria = mongoose.model("categorias")
require("../models/Postagem")
const Postagem = mongoose.model("postagens")
const {isAdmin} = require("../helpers/isAdmin")

// Rotas
    router.get('/', isAdmin, (req, res) =>{
        res.render("admin/index")
    })
    router.get('/anuncios', isAdmin, (req, res) => {
        res.send("Anuncios do admin")
    })

    router.get("/categorias", isAdmin, (req, res) =>{
        Categoria.find().sort({date: 'desc'}).lean().then((categorias) =>{
            res.render("admin/categorias", {categorias})
        }).catch((err) =>{
            req.flash("error_msg", "Houve um erro ao listar as categorias")
            res.redirect("/admin")
        })
    })

    router.get("/categorias/add", isAdmin, (req, res) =>{
        res.render("admin/addcategorias")
    })


    router.post("/categorias/nova", isAdmin, (req, res) =>{

        var erros = []

        if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
            erros.push({texto: "Nome Invalido"})
        }

        if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
            erros.push({texto: "Slug Invalido"})
        }

        if(erros.length > 0){
            res.render("admin/addcategorias", {erros: erros})
        }else{
            const novaCategoria = {
                nome: req.body.nome,
                slug: req.body.slug
            }
    
            new Categoria(novaCategoria).save().then(() =>{
                req.flash("success_msg", "Categoria criada com sucesso")
                res.redirect("/admin/categorias")
            }).catch((err) =>{
                req.flash("erros_msg", "Houve um erro ao salvar a categoria, tente novamente")
                res.redirect("/admin")
            })
        }
    })


    router.get("/categorias/edit/:id", isAdmin, (req, res) =>{
        Categoria.findOne({_id:req.params.id}).lean().then((categoria) =>{
        res.render("admin/editcategorias", {categoria: categoria})
        }).catch((err) => {
            req.flash("error_msg", "Esta categoria não existe")
            res.redirect("/admin/categorias")
        }) 
    })

    router.post("/categorias/edit", isAdmin, (req, res) =>{

        Categoria.find({_id: req.body.id}).then((categoria) =>{
            
            categoria.nome = req.body.nome
            categoria.slug = req.body.slug

            categoria.save().then(() =>{
                req.flash("success_msg", "Categoria editada com sucesso")
                res.redirect("/admin/categorias")
            }).catch((err) =>{
                req.flash("error_msg", "Houve um erro interno ao salvar a edição da categoria")
                res.redirect("/admin/categorias")
            })

        }).catch((err) =>{
            req.flash("error_msg", "Houve um erro ao editar a categoria")
            res.redirect("/admin/categorias")
        })

    })

    router.post("/categorias/deletar", isAdmin, (req,res) =>{
        Categoria.deleteMany({_id: req.body.id}).then(() =>{
            req.flash("success_msg", "Categoria excluida com sucesso!")
            res.redirect("/admin/categorias")
        }).catch((err) =>{
            req.flash("error_msg", "Não foi possivel excluir a categoria")
            res.redirect("/admin/categorias")
        })
    })


    router.get("/postagens", isAdmin, (req, res) =>{

        Postagem.find().populate("categoria").sort({data:"desc"}).lean().then((postagens) =>{
            res.render("admin/postagens", {postagens: postagens})
        }).catch((err) =>{
            req.flash("error_msg", "Houve um erro ao listar as postagens ")
            res.redirect("/admin")
        })
    })

    router.get("/postagens/add", isAdmin, (req, res) =>{
        Categoria.find().lean().then((categorias) =>{
            res.render("admin/addpostagem", {categorias: categorias})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao carregar o formulario")
            res.redirect("/admin")
        })
       
    })

    router.post("/postagens/nova", isAdmin, (req,res) =>{

        var erros = []

        if(req.body.categoria == "0"){
            erros.push({texto: "Categoria inválida, registre uma categoria"})
        }

        if(erros.length > 0){
            res.render("admin/addpostagem", {erros: erros})
        }else{
            const novaPostagem = {
                titulo: req.body.titulo,
                descricao: req.body.descricao,
                conteudo: req.body.conteudo,
                categoria: req.body.categoria,
                slug: req.body.slug
            }

            new Postagem(novaPostagem).save().then(() =>{
                req.flash("success_msg", "Postagem criada com sucesso!")
                res.redirect("/admin/postagens")
            }).catch((err) =>{
                req.flash("error_msg", "Houve um erro durante o salvamento da postagem")
                res.redirect("/admin/postagens")
            })

        }

    })

    router.get("/postagens/edit/:id", isAdmin, (req, res) =>{
        Postagem.findOne({_id: req.params.id}).lean().then((postagem) =>{

            Categoria.find().lean().then((categorias) =>{
                res.render("admin/editpostagens", {categorias: categorias, postagem: postagem})
            }).catch((err) =>{
                req.flash("error_msg", "Houve um erro ao listar as categorias")
                res.redirect("/admin/postagens")
            })

        }).catch((err) =>{
            req.flash("error_msg", "Houve um erro ao carregar o formulario de edição!")
            res.render("/admin/postagens")
        })
        
    })

    router.post("/postagem/edit", isAdmin, (req, res) =>{
        Postagem.find({_id: req.body.id}).then((postagem) =>{
            
            postagem.titulo = req.body.titulo
            postagem.slug = req.body.slug
            postagem.descricao = req.body.descricao
            postagem.conteudo = req.body.conteudo
            postagem.categoria = req.body.categoria            

            postagem.save().then(() =>{
                req.flash("success_msg", "Postagem editada com sucesso")
                res.redirect("/admin/postagens")
            }).catch((err) =>{
                req.flash("error_msg", "Houve um erro interno ao salvar a edição da postagem")
                res.redirect("/admin/postagens")
            })

        }).catch((err) =>{
            req.flash("error_msg", "Houve um erro ao editar a postagem")
            res.redirect("/admin/postagens")
        })

    })
    // trocar para post depois
    router.post("/postagens/deletar/:id", isAdmin, (req, res) =>{
        Postagem.deleteOne({_id: req.params.id}).lean().then(() =>{
            res.flash("success_msg", "Postagem deletada com sucesso!")
            res.redirect("/admin/postagens")
        }).catch((err) =>{
            req.flash("error_msg", "Houve um erro interno ")
            res.redirect("/admin/postagens")
        })
    })



module.exports = router