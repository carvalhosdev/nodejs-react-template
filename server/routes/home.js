const router = require("express").Router();
const checkAuth = require("../middleware/checkAuth");
//const {prisma} = require("../db");
/**
 * @openapi
 * /:
 *  get:
 *      description: Welcome home
 *      responses:
 *          200:
 *              description: Returns Hello from server
 */
router.get("/", (req, res) => {
    return res.json({
        msg: "hello"
    });
})

/**
 * @swagger
 * /private-test:
 *  get:
 *      security:
 *      - bearerAuth: []
 *      description: Test a private endpoint, only with Bearer Token
 *      responses:
 *          200:
 *              description: Returns Hello from server
 *          403:
 *              description: Token not provided
 */
router.get("/private-test", checkAuth , (req, res) => {
    return res.send("Private page test")
})

module.exports = router;