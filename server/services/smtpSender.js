const {createTransport} = require("nodemailer")


module.exports = async(opt) => {

    if(!opt){
        //todo
    }

    const transporter = createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user:  process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: opt.to,
        subject: opt.subject,
        html: opt.body //todo
    };

    return await transporter.sendMail(mailOptions);
}

