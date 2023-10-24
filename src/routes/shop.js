import { Router } from "express";
import auth from "../middleware/auth.js";
import allowAnonAuth from "../middleware/allowAnonAuth.js";
import Product from "../model/product.schema.js";
import { isValidObjectId } from "mongoose";
import Cart from "../model/cart.schema.js" 


const router = Router();




/**
* @openapi
* components:
*   schemas:
*     Product:
*       type: object
*       required:
*         - name
*         - descripion
*         - price
*       properties:
*         name:
*           type: string
*           description: The name of the product
*         description:
*           type: string
*           description: A short description of the product
*         price:
*           type: string
*           description: The price of the product
*/

/**
* @openapi
* tags:
*   name: Products
*/



/**
 * @openapi
 * /api/shop/items:
 *   get:
 *     description: This API is used to return list of products for sale with or without login excluding the ones owned by the logged in user
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: page number
 *         schema:
 *           type: string
 *       - in: query
 *         name: page_size
 *         required: false
 *         description: number of items per page
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/', allowAnonAuth, async (req, res) => {
  const start_time = Date.now();
  try {
    const user_id = req?.user?.user_id;
    let all_products;
    
    let page_number = 1;
    let query_size = 10;
    const {page, page_size} = req.query;
    if (page) page_number = parseInt(page);
    if (page_size) query_size = parseInt(page_size);
    let totalProducts;

    if (user_id) {
      all_products = await Product.find({ owner: { $ne: user_id } })
                    .sort({ createdAt: -1 })
                    .skip((page_number - 1) * query_size)
                    .limit(query_size)
                    .exec()
      totalProducts = await Product.countDocuments({ owner: { $ne: user_id }});
    } else {
      all_products = await Product.find({ buyer: null })
                    .sort({ createdAt: -1 })
                    .skip((page_number - 1) * query_size)
                    .limit(query_size)
                    .exec()
      totalProducts = await Product.countDocuments({ buyer: null });
    }

    if (user_id) {
      const ownerBoughtProducts = await Product.countDocuments({ owner: { $ne: user_id}, buyer: { $exists: true } });
      totalProducts -= ownerBoughtProducts;
    }
    const pageCount = Math.ceil(totalProducts/query_size);
    
    if (!all_products) {
      return res.status(400).send({
        msg: "Error",
        data: null,
        status: "failed",
        error: "No products found"
      });
    }
    const cleaned = all_products.map(product => {
      const { name, description, createdAt, price } = product;
      return { name, description, createdAt, price, id: product._id };
    });

    const end_time = Date.now();
    const time_taken = end_time - start_time;
    console.log(`Time taken: ${time_taken}ms`);

    const hasNext = page_number < pageCount;
    const hasPrevious = page_number > 1;

    res.status(200).json({
      hasNext,
      hasPrevious,
      Page: page_number,
      PageCount: pageCount,
      TotalProducts: totalProducts,
      Products: cleaned
    })
  } catch (e) {
    console.log(e);
    res.status(400).send({
      msg: "Error",
      data: null,
      status: "failed",
      error: e.message
    });
  }
});


//validate price 
const validateNum = (num) => {
  const parsed = parseFloat(num) 
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error("Invalid Price");
  }
    return parsed;
  }

/**
 * @openapi
 * /api/shop/items:
 *   post:
 *     description: This API is used to create a new product 
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/' , auth, async (req , res) => {
  const {name, description, price} = req.body
  const { user_id } = req.user
  
  let validated_price;
  try{
      validated_price = validateNum(price)
  }
  catch{
    return res.status(400).send({
      msg: "Invalid Price",
      data: null,
      error: "Invalid Price",
      status: "failed"
    })
  }
  
  try{
    const new_product = await Product.create({
      name, 
      description, 
      price:validated_price,
      owner: user_id
    })
    res.status(201).json({
      msg: "Product created successfully",
      status: "success",
      data: new_product
    })
  }
  catch(err) {
    console.log(err)
    res.status(400).send({
      msg: "Product not created",
      data: null,
      status: "failed",
      error: err.message
    });
  }
    
});


/**
 * @openapi
 * /api/shop/items/{id}:
 *   get:
 *     description: This API is used to get the details of a product with the given ID. 
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the product required
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Details of the product is retrieved successfully
 */
router.get('/:id', auth, async(req, res) => {
  try{
    const product_id = req.params.id;
    if (!isValidObjectId(product_id))
      throw new Error('Invalid product ID');

    const product = await Product.findById(product_id);

    if (!product) {
      return res.status(404).json({
        msg: 'No product found',
        data: null,
        status: 'failed',
        error: 'Product_not_found'
      });
    }

    const { name, description, createdAt, price } = product;
    const productData = {
      id: product._id,
      name,
      description,
      createdAt,
      price
    };

    res.status(200).json({
      msg: 'Product details retrieved successfully',
      status: 'success',
      data: productData
    });
  } catch (err) {
    res.status(400).json({
      msg: 'Invalid ID',
      data: null,
      status: 'failed',
      error: err.message
    });
  }
});




/**
 * @openapi
 * /api/shop/items/{id}:
 *   put:
 *     description: This API is used to update all details of a product with the given ID.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the product required
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: The product details have been updated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *               example:
 *                 name: "example"
 *                 description: "example is a great product"
 *                 price: "79.99"
 */
router.put('/:id', auth, async(req, res) => {
  try{
    const product_id = req.params.id;
    const {name, description, price} = req.body;
    if(!isValidObjectId(product_id))
      throw new Error("Invalid product ID");

    if (!name && !description && !price) 
      throw new Error('All input are required.');

    if (!name) 
      throw new Error ("name may not be empty")
    
    if (!description) 
      throw new Error ("description may not be empty");
    
    if (!price) 
      throw new Error ("price may not be empty");
    
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).send({
        msg: "Product not found",
        data: null,
        status: "failed"
      });
    } else {
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = validateNum(price) || product.price;
    const updatedProduct = await product.save();
    res.status(200).json({
      msg: "Product Updated",
      data: updatedProduct,
      status: "success"
    });              
    }
  } catch(err) {
    if (err.message === "name may not be empty") 
        res.status(400).json({ Name: err.message });
    else if (err.message === "description may not be empty") 
        res.status(400).json({ Description: err.message });
    else if (err.message === "price may not be empty") 
        res.status(400).json({ Price: err.message });
    else if (err.message === "Invalid product ID")
        res.status(400).json({ ID: err.message });
    else 
        res.status(500).json({ error: err.message });
  }
});


/**
 * @openapi
 * /api/shop/items/{id}:
 *   patch:
 *     description: This API is used to update any/all details of a product with the given ID.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the product required
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: The product details have been updated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *               example:
 *                 name: "example"
 *                 description: "example is a great product"
 *                 price: "79.99"
 */
router.patch('/:id', auth, async (req, res) => {
  try {
    const product_id = req.params.id;
    const { name, description, price } = req.body;
    if (!isValidObjectId(product_id))
      throw new Error('Invalid product ID');

    const product = await Product.findById(product_id);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!name && !description && !price) 
      throw new Error('At least one input is required.');
      
    if (name) 
      product.name = name || product.name;

    if (description)
      product.description = description || product.description;
    
    if (price !== undefined) {
      const validated_price = validateNum(price);
      if (validated_price === null) {
          throw new Error('Invalid price');
      }
      product.price = validated_price;
    }

    const updatedProduct = await product.save();
    res.status(200).json({
      msg: "Product Updated",
      data: updatedProduct,
      status: "success"
    });  

  } catch (err) {
    if (err.message === "Invalid product ID")
      res.status(400).json({ ID: err.message });
    else 
      res.status(500).json({ error: err.message });
  }
});



/**
 * @openapi
 * /api/shop/items/{id}:
 *   delete:
 *     description: This API is used to delete a product with the given ID.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the product required
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The product has been deleted
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const product_id = req.params.id;
    if (!isValidObjectId(product_id))
      throw new Error('Invalid product ID');
    await Product.findByIdAndDelete(product_id);

    res.send({
      msg: "Product Deleted",
      data: null,
      status: "success"
    });
  } catch (err) {
    res.status(400).send({
      msg: "Error deleting product",
      data: null,
      status: "failed",
      error: err.message
    });
  }
  });


  /**
 * @openapi
 * components:
 *   schemas:
 *     Cart:
 *       type: object
 *       required:
 *         - productId
 *         - price 
 *       properties:
 *         productId:
 *           type: string
 *           description: The id of the product
 *         price:
 *           type: string
 *           description: The price of the product
 */


  /**
  * @openapi
  * tags:
  *   name: Cart
  */


/**
 * @openapi
 * /api/shop/items/cart:
 *   post:
 *     description: This API is used to add a product to the cart.
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Cart'
 *             required:
 *               - products
 *     responses:
 *       200:
 *         description: The product has been added to the cart
 */
router.post('/cart', auth, async (req, res) => {
  try {
    const { products } = req.body;
    const { user_id } = req.user;
    let cartItems = [];
    let changedProductPrice = [];
    let productIdInvalid = [];

    for (const item of products) {
      const { productId , price } = item;
      const product = await Product.findById(productId);
      if (!product) {
        productIdInvalid.push({ id: productId });
      }
      if(user_id == product.owner) {
        return res.status(400).json({ error: 'You cannot buy your own product' });
      } else {
        if ((product.price) !== (price)) {
          changedProductPrice.push({ id: productId, newPrice: product.price });
        }
        if (product.available === false) {
          return res.status(400).json({ error: 'Product is no longer available' });
        }
        cartItems.push({
          user: user_id,
          product: productId
        });
        product.buyer = user_id;
        await product.save();
      }
    }

    if (productIdInvalid.length > 0) {
      return res.status(400).json({
        message: 'Invalid ProductId',
        error: 'ProductId_Incorrect',
        productIds: productIdInvalid
      });
    }

    if (changedProductPrice.length > 0) {
      return res.status(400).json({
        message: 'Price has changed',
        error: 'Price_changed',
        productIds: changedProductPrice
      });
    }

    const createdCartItems = await Cart.insertMany(cartItems);

    const populatedCartItems = await Cart.find({ _id: { $in: createdCartItems.map(item => item._id) } })
      .populate('product', 'name');

    res.status(200).json({
      msg: 'Products added to cart',
      status: 'success',
      data: {
        userId: user_id,
        cartItems: populatedCartItems.map(item => ({
          productId: item.product._id,
          productName: item.product.name
        }))
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      msg: 'Internal server error',
      status: 'failed',
      error: err.message
    });
  }
});

export default router;