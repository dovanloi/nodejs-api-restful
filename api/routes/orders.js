const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Order = require('../models/order');
const Product = require('../models/product');

router.get('/', (req, res, next)=>{
    Order.find()
        .populate('product', 'name price')
        .select('quantity product _id')
        .exec()
        .then(docs => {
            res.status(200).json({
                count: docs.length,
                orders: docs.map(doc =>{
                    return {
                        _id: doc._id,
                        product: doc.product,
                        quantity: doc.quantity,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/orders/'+ doc.id
                        }
                    }
                })
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.post('/', (req, res, next)=>{
    Product.findById(req.body.productId)
        .then(product=>{
            if(!product){
                return res.status(404).json({
                    message: "Product not found"
                })
            }
            const order = new Order({
                _id: mongoose.Types.ObjectId(),
                quantity: req.body.quantity,
                product: req.body.productId
            });
            return order.save();
        })
        .then(result=>{
            console.log(result);
            res.status(201).json({
                message: 'Order stored',
                createdOrder: {
                    _id: result._id,
                    product: result.product,
                    quantity: result.quantity,
                },
                request: {
                    type: 'GET',
                    url: 'http://localhost:3000/orders/'+ result.id
                }
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            })
        })
});

router.get('/:id', (req, res, next)=>{
    const id = req.params.id;
    Order.findById(id)
        .populate('product')
        .select()
        .exec()
        .then(order => {
            console.log("From database", order);
            if(order){
                res.status(200).json({
                    order: order,
                    request: {
                        type: 'GET',
                        description: 'Get all orders',
                        url: "http://localhost:3000/orders/"
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
    res.status(200).json({
        message: 'patch',
        id: id
    });
});

router.delete('/:id', (req, res, next)=>{
    const id = req.params.id;
    Order.remove({ _id: id})
        .exec()
        .then(result => {
            res.status(200).json({
               message: 'Order deleted',
                request: {
                    type: 'POST',
                    description: 'Post order',
                    url: "http://localhost:3000/orders/",
                    body: { productId: 'ID', quantity: 'Number'}
                }
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

module.exports = router;