const router = require("express").Router();
const {check, validationResult} = require("express-validator");
const {prisma} =require("../db");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");

//signup- Account
router.post("/signup",
[
        check("email", "Please, fill a valid e-mail").isEmail(),
        check("password", "Please, fill the password with min 6 characters").isLength({min:6}),
        check("username", "Please, fill the username with min 6 characters").isLength({min:6}),
    ], async (req, res) => {

    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors: errors.array()
        });
    }
    const {email, password, username} = req.body;

    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if(user){
        return res.status(400).json({
            errors:[{ msg: "This user already exists"}]
        });
    }

    //hasing password
    const hashPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
        data: {
            email,
            username,
            password: hashPassword
        },
        select: {
            id:true,
            username:true,
            email:true
        }
    })

    //json webtoken
    const token = await JWT.sign(newUser,
        process.env.JSON_WEB_TOKEN_SECRET,
        { expiresIn: 360000})

    return res.json({
        user: newUser,
        token: token
    });
});

//login
router.post("/login", async (req,res) => {
    const {email, password} =req.body;

    const user = await prisma.user.findUnique({
        where: {email}
    })

    if(!user){
        return res.status(400).json({
            errors:[{ msg: "Invalid crendentials"}]
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        return res.status(400).json({
            errors:[{ msg: "Invalid crendentials"}]
        });
    }

    const userPayload = {
        id: user.id,
        email: user.email,
        username: user.username
    }
    //json webtoken
    const token = await JWT.sign(userPayload,
        process.env.JSON_WEB_TOKEN_SECRET,
        { expiresIn: 360000})

    return res.json({
        user: userPayload,
        token: token
    });

})


router.get("/me", async (req, res) => {
    //get from headers
    const bearerToken = req.headers.authorization;
    if(!bearerToken) return res.status(401).send(null)
    const jwt = bearerToken.split("Bearer ")[1];

    if(!jwt) return res.status(401).send(null);

    let payload;
    try {
        payload = await JWT.verify(jwt, process.env.JSON_WEB_TOKEN_SECRET);
    }catch (error) {
        return res.status(401).send(null)
    }

    const user = await prisma.user.findUnique({
        where: {
            email: payload.email
        },
        select: {
            id: true,
            email: true,
            username: true
        }
    });

    return res.json(user);
})

module.exports = router;