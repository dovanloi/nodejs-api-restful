const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const checkAuth = require('../middleware/check-auth');

const Product = require('../models/product');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function(req, file, cb) {
        cb(null,new Date().toISOString().replace(/:/g, '-') + file.originalname); // macos chỉ cần new Date().toISOString()
    }
});

const fileFilter = (req, file, cb) => {
    // reject a file
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
        cb(null, true);
    } else{
        cb(null, false);
    }
}

const upload = multer({
    storage: storage, 
    limits: {
        fieldSize: 1024 * 1024* 5
    },
    fileFilter: fileFilter
});

router.get('/', (req, res, next)=>{
    Product.find()
        .select('name price _id productImage')
        .exec()
        .then(docs =>{
            const response = {
                count: docs.length,
                products: docs.map(doc => {
                    return {
                        name: doc.name,
                        price: doc.price,
                        productImage: doc.productImage,
                        _id: doc._id,
                        request: {
                            type: "GET",
                            url: "http://localhost:3000/products/"+ doc._id
                        }
                    }
                })
            };
                console.log(docs);
                res.status(200).json(response);
            
           
        })
        .catch( err =>{
            console.log(err);
            res.status(500).json({error: err})
        })
});

router.post('/', checkAuth, upload.single('productImage'), (req, res, next)=>{
    console.log(req.file);
    const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price,
        productImage: req.file.path
    });
    product
        .save()
        .then(result =>{
            console.log(result);
            res.status(200).json({
                message: 'Created product successfully',
                createdProduct: {
                    name: result.name,
                        price: result.price,
                        _id: result._id,
                        request: {
                            type: "GET",
                            url: "http://localhost:3000/products/"+ result._id
                        }
                }
            });
        })
        .catch(err=> {
            console.log(err);
            res.status(500).json({
                error: err
            })
        });
});

router.get('/:id', (req, res, next)=>{
    const id = req.params.id;
    Product.findById(id)
        .select('name price _id productImage')
        .exec()
        .then(doc => {
            console.log("From database", doc);
            if(doc){
                res.status(200).json({
                    product: doc,
                    request: {
                        type: 'GET',
                        description: 'Get all products',
                        url: "http://localhost:3000/products/"
                    }
                });
            } else {
                res.status(404).json({message : 'No valid entry ... of id'});
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({error : err});
        });
});

router.patch('/:id', (req, res, next)=>{
    const id = req.params.id;
    const updateOps = {};
    for(const ops of req.body){
        updateOps[ops.propName]= ops.value;
    }
    Product.update({_id: id}, {$set : updateOps})
    .exec()
    .then(result => {
        res.status(200).json({
            message: 'Product updated',
                request: {
                    type: 'GET',
                    description: 'Get product',
                    url: 'http://localhost:3000/products/'+ id
                }
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    })
});

router.delete('/:id', (req, res, next)=>{
    const id = req.params.id;
    Product.remove({_id: id})
        .exec()
        .then(result => {
            res.status(200).json({
                message: 'Product delete',
                request: {
                    type: 'POST',
                    description: 'POST products',
                    url: 'http://localhost:3000/products/',
                    body: { name: 'String', price: 'Number'}
                }
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({error: err});
        });
});

module.exports = router;