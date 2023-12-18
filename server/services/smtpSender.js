const {createTransport} = require("nodemailer")
const hbs = require("nodemailer-express-handlebars")
const path = require("path")

module.exports = async(opt) => {

    if(!opt){
        throw new Error("Opt parameter is missing")
    }
    const {to, subject, html, template, context} = opt;

    const transporter = createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user:  process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    let mailOptions = {
        from: process.env.SMTP_USER,
        to: to,
        subject: subject,

    };

    //template
    const handlebarOptions = {
        viewEngine: {
            partialsDir: path.resolve(path.join(__dirname, 'email-templates')),
            defaultLayout: false
        },


        viewPath: path.resolve(path.join(__dirname,'email-templates'))
    }

    transporter.use('compile', hbs(handlebarOptions))

    if(html){
        mailOptions.html = html;
    }else{
        mailOptions.template = template;
        mailOptions.context = context;
    }

    try{
        return await transporter.sendMail(mailOptions);
    }catch (err){
        return err;
    }
}

