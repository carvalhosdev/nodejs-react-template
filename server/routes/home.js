const router = require("express").Router();
const checkAuth = require("../middleware/checkAuth");
//const {prisma} = require("../db");

router.get("/", (req, res) => {
    return res.send("Hello from server...");
})

//test with middleware auth
router.get("/private-test", checkAuth , (req, res) => {
    return res.send("Private page test")
})

module.exports = router;