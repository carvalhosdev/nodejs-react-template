const express = require("express");
const cors = require("cors");
const app = express();
const fs = require("fs");
const https = require("https");
const path = require("path");

const sslServer = https.createServer(
    {
        key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
    },
    app
);

app.use(express.json());
app.use(cors());

app.use("", require("./routes/home"));
app.use("/auth", require("./routes/auth"));

sslServer.listen(8080, () => {
    console.log("SSL listen on port 8080");
})
