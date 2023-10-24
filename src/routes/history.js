import { Router } from 'express';
import auth from "../middleware/auth.js";
import Product from "../model/product.schema.js";
import { Response } from "../utils/helpers.js";


const router = Router();


/**
* @openapi
* tags:
*   name: History
*/

/**
 * @openapi
 * /api/shop/history/sale:
 *   get:
 *     description: This API is used to get all user's products for sale
 *     tags: [History]
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
 *         description: successful response
 */
router.get("/sale", auth, async(req, res)=>{
    const {user_id} = req.user
    try{
        let page_number = 1;
        let query_size = 10;
        const {page, page_size} = req.query;
        if (page) page_number = parseInt(page);
        if (page_size) query_size = parseInt(page_size);
        const totalProducts = await Product.countDocuments({owner:user_id, buyer:null});
        const pageCount = Math.ceil(totalProducts/query_size);

        const for_sale =   await Product.find({owner:user_id, buyer:null})
                                        .sort({ createdAt: -1 })
                                        .skip((page_number - 1) * query_size)
                                        .limit(query_size)
                                        .exec()
        const cleaned = for_sale.map( product => {
            const {name, description, createdAt, price} = product
            return {name, description, createdAt, price, id:product._id}
        })

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
    }
    catch(e){
        Response(res, 400, msg=e.message)
    }
})


/**
 * @openapi
 * /api/shop/history/sold:
 *   get:
 *     description: This API is used to get all user's products sold
 *     tags: [History]
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
 *         description: successful response
 */
router.get("/sold", auth, async(req, res) => {
    try {
    const {user_id} = req.user
    let page_number = 1;
    let query_size = 10;
    const {page, page_size} = req.query;
    if (page) page_number = parseInt(page);
    if (page_size) query_size = parseInt(page_size);
    const totalProducts = await Product.countDocuments({ owner: user_id, buyer: { $exists: true } });
    const pageCount = Math.ceil(totalProducts/query_size);
    const sold =   await Product.find({ owner: user_id, buyer: { $exists: true } })
                                .sort({ createdAt: -1 })
                                .skip((page_number - 1) * query_size)
                                .limit(query_size)
                                .exec()
    const hasNext = page_number < pageCount;
    const hasPrevious = page_number > 1;

    res.status(200).json({
        hasNext,
        hasPrevious,
        Page: page_number,
        PageCount: pageCount,
        TotalProducts: totalProducts,
        Products: sold
    });
    } catch (err) {
    console.log(err);
    res.status(400).send({
      msg: "Error",
      data: null,
      status: "failed",
      error: err.message
    });
}
});


/**
 * @openapi
 * /api/shop/history/purchased:
 *   get:
 *     description: This API is used to get all products purchased by user
 *     tags: [History]
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
 *         description: successful response
 */
router.get("/purchased", auth, async(req, res) => {
    try {
    const {user_id} = req.user
    let page_number = 1;
    let query_size = 10;
    const {page, page_size} = req.query;
    if (page) page_number = parseInt(page);
    if (page_size) query_size = parseInt(page_size);
    const totalProducts = await Product.countDocuments({ buyer: user_id, owner: { $exists: true } });
    const pageCount = Math.ceil(totalProducts/query_size);
    const purchased =  await Product.find({ buyer: user_id, owner: { $exists: true } })
                                    .sort({ createdAt: -1 })
                                    .skip((page_number - 1) * query_size)
                                    .limit(query_size)
                                    .exec()
    const hasNext = page_number < pageCount;
    const hasPrevious = page_number > 1;

    res.status(200).json({
        hasNext,
        hasPrevious,
        Page: page_number,
        PageCount: pageCount,
        TotalProducts: totalProducts,
        Products: purchased
    });
} catch (err) {
    console.log(err);
    res.status(400).send({
      msg: "Error",
      data: null,
      status: "failed",
      error: err.message
    });
}
});

export default router
