const express = require("express");

const cors = require("cors");
const app = express();
const fs = require("fs");
const https = require("https");
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const rateLimitMiddleware = require("./middleware/rateLimit");

const sslServer = https.createServer(
    {
        key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
    },
    app
);

const options = {
    failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
    definition: {
        openapi: '3.0.1',
        info: {
            title: 'Starter API',
            version: '1.0.0',
        },
        basePath: '/',
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'apiKey',
                    name: 'Authorization',
                    scheme: 'bearer',
                    in: 'header',
                    bearerFormat: 'JWT',
                },
            }

        },
    },
    apis: ['./routes/*.js'],
};
const openapiSpecification = swaggerJsdoc(options);

app.use(express.json());
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(openapiSpecification));
app.use(cors());
app.use(rateLimitMiddleware)
app.use("", require("./routes/home"));
app.use("/auth", require("./routes/auth"));

app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openapiSpecification);
});

sslServer.listen(8080, () => {
    console.log("SSL listen on port 8080");
})
