const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'unihub.gp@gmail.com',
        pass: 'ebix sakd unxq hvnj'
    }
});

module.exports = transporter;
