const router = require("express").Router();
const {check, query, validationResult} = require("express-validator");
const {prisma} =require("../db");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const {tokenString, dateExpire, verifyExpiredDate} = require("../utils/helper")
const {verify} = require("jsonwebtoken");
const smtpSender = require("../services/smtpSender")
const {response} = require("express");

//signup- Account
router.post("/signup",[
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
            password: hashPassword,
            activation_token: tokenString(64)
        },
        select: {
            id:true,
            username:true,
            email:true,
            activation_token: true

        }
    })

    //json webtoken
    const token = await JWT.sign(newUser,
        process.env.JSON_WEB_TOKEN_SECRET,
        { expiresIn: 360000})

    //send email
    /*await smtpSender({
        to: email,
        subject: "Welcome to your company",
        template: "welcome",
        context: {
            company: "Your Company",
            username: username,
            //replace react ui
            activation: `https://localhost:8080/auth/activate?activation_token=${newUser.activation_token}`
        }
    });*/

    return res.json({
        user: newUser,
        token: token
    });
});

//login
router.post("/login", [
    check("email", "Please, fill a valid e-mail").isEmail(),
    check("password", "Please, fill the password").not().isEmpty()
],async (req,res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors: errors.array()
        });
    }
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


//active account
router.get("/activate", async (req, res) => {

    const {activation_token} = req.query;
    if(!activation_token){
        return res.status(403).json({
            errors: [
                { msg: "Unauthorized"}
            ]
        })
    }

    const user = await prisma.user.findFirst({
        where: {
            activation_token : activation_token
        }
    });

    if(!user){
        return res.status(403).json({
            errors: [
                { msg: "Unauthorized"}
            ]
        })
    }

    if(user.activated_at){
        return res.status(204).end();
    }

    await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            activated_at : new Date()
        }
    })
    return res.status(204).end();
});

//forgot
router.post("/forgot",[check("email", "Please, fill a valid e-mail").isEmail()], async (req, res) => {

    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors: errors.array()
        });
    }
    const email = req.body.email;

    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if(!user){
        return res.status(404).json({
            errors: [
                {
                    msg: "User not registred"
                }
            ]
        })
    }

    const forgot_token = tokenString(32);
    const forgot_token_expire = dateExpire();

    await prisma.user.update({
        where:{
            id: user.id
        },
        data: {
            forgot_token,
            forgot_token_expire
        }

    })

    return res.status(204).end();
})

//reset
router.post("/reset",
    [
        check("password", "Please, fill the password with min 6 characters").isLength({min:6}),
        check("repassword", "Please, fill the password with min 6 characters").isLength({min:6}),
        check("repassword", "Password not match").custom((value, {req}) => value === req.body.password),
        query("forgot_token", "The reset token not present").not().isEmpty(),
    ],
    async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors: errors.array()
        });
    }

    const forgot_token = req.query.forgot_token;
    const password = req.body.password;

    const user = await prisma.user.findFirst({
        where: {
            forgot_token
        }
    });

    if(!user){
        return res.status(401).json({
            errors: [
                {
                    msg: "Unautherized"
                }
            ]
        })
    }

    if(!verifyExpiredDate(user.forgot_token_expire)){
        return res.status(401).json({
            errors: [
                {
                    msg: "Sorry, the token is expired"
                }
            ]
        })
    }

    const hashPassword = await bcrypt.hash(password, 10)
    await prisma.user.update({
        where:{
            id: user.id
        },
        data: {
            forgot_token: null,
            forgot_token_expire: null,
            password: hashPassword
        }
    });


    return res.status(204).end();

})

//me
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
            username: true,
            activated_at: true,
            activation_token: true
        }
    });

    return res.json(user);
})

module.exports = router;