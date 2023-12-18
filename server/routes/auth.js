const router = require("express").Router();
const {check, query, validationResult} = require("express-validator");
const {prisma} =require("../db");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const {tokenString, dateExpire, verifyExpiredDate} = require("../utils/helper")
//const smtpSender = require("../services/smtpSender")


const requiredToSignUP = [
    check("email", "Please, fill a valid e-mail").isEmail(),
    check("password", "Please, fill the password with min 6 characters").isLength({min:6}),
    check("username", "Please, fill the username with min 6 characters").isLength({min:6})
];


/**
 * @swagger
 * /auth/signup:
 *  post:
 *      description: Make an user registration
 *      produces:
 *          - application/json
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                       type: object
 *                       properties:
 *                          email:
 *                              type: string
 *                          password:
 *                              type: string
 *                          username:
 *                              type: string
 *      responses:
 *          200:
 *              description: Returns JSON Token JWT
 *          400:
 *              description: Parameters required not informed
 */
router.post("/signup", requiredToSignUP ,async (req, res) => {
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
    });

    const token = await JWT.sign(newUser,
        process.env.JSON_WEB_TOKEN_SECRET,
        { expiresIn: 360000})

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
const requiredToLogin = [
    check("email", "Please, fill a valid e-mail").isEmail(),
    check("password", "Please, fill the password").not().isEmpty()
]
/**
 * @swagger
 * /auth/login:
 *  post:
 *      description: Make an user login
 *      produces:
 *          - application/json
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                       type: object
 *                       properties:
 *                          email:
 *                              type: string
 *                          password:
 *                              type: string
 *      responses:
 *          200:
 *              description: Returns JSON Token JWT
 *          400:
 *              description: Parameters required not informed
 */
router.post("/login",requiredToLogin,async (req,res) => {
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

    const token = await JWT.sign(userPayload,
        process.env.JSON_WEB_TOKEN_SECRET,
        { expiresIn: 360000})

    return res.json({
        user: userPayload,
        token: token
    });
})

/**
 * @swagger
 * /auth/activate:
 *  get:
 *      description: Make the account be activated
 *      produces:
 *          - application/json
 *      parameters:
 *        - name: activation_token
 *          description: "Token provided by email"
 *          in: query
 *          required: true
 *          schema:
 *           type: string
 *      responses:
 *          200:
 *              description: Returns JSON Token JWT
 *          400:
 *              description: Parameters required not informed
 */
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

const requiredToForgot = [
    check("email", "Please, fill a valid e-mail").isEmail()
]
/**
 * FORGOT ENDPOINT - FORGOT ACCOUNT SENDING A TOKEN TO EMAIL
 * @param email
 */

/**
 * @swagger
 * /auth/forgot:
 *  post:
 *      description: If the user forgot his password
 *      produces:
 *          - application/json
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                       type: object
 *                       properties:
 *                          email:
 *                              type: string
 *      responses:
 *          204:
 *              description: Nothing, just updated
 *          400:
 *              description: Parameters required not informed
 */
router.post("/forgot", requiredToForgot, async (req, res) => {
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
                    msg: "User not registered"
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

    /*await smtpSender({
        to: email,
        subject: "You forgot the password",
        template: "forgot",
        context: {
            company: "Your Company",
            username: user.username,
            //replace react ui
            activation: `another url to return to web site`
        }
    });*/

    return res.status(204).end();
})


const requiredToReset = [
    check("password", "Please, fill the password with min 6 characters").isLength({min:6}),
    check("repassword", "Please, fill the password with min 6 characters").isLength({min:6}),
    check("repassword", "Password not match").custom((value, {req}) => value === req.body.password),
    query("forgot_token", "The reset token not present").not().isEmpty()
]

/**
 * @swagger
 * /auth/reset:
 *  post:
 *      description: "When user reset his password"
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: reset_token
 *      in: query
 *      required: true
 *      schema:
 *          type: string
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                       type: object
 *                       properties:
 *                          password:
 *                              type: string
 *                          repassword:
 *                              type: string
 */
router.post("/reset", requiredToReset, async (req, res) => {
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
                    msg: "Sorry, this token is expired"
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

/**
 * @swagger
 * /auth/me:
 *  get:
 *      description: user token information
 *      security:
 *      - bearerAuth: []
 *      responses:
 *          200:
 *              description: User info
 *          403:
 *              description: Invalid parameters
 */
router.get("/me", async (req, res) => {
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