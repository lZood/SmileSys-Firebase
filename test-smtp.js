const nodemailer = require('nodemailer');

(async () => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'devsmilesys@gmail.com',
      pass: 'mcwvuxhitwqfttwg' // App Password (sin espacios)
    }
  });

  try {
    const info = await transporter.sendMail({
      from: '"SmileSys Test" <devsmilesys@gmail.com>',
      to: 'cuchuspam@gmail.com',
      subject: 'Prueba SMTP desde Node',
      text: 'Correo de prueba enviado desde nodemailer usando App Password.'
    });
    console.log('ENVIADO:', info);
  } catch (err) {
    console.error('ERROR SMTP:', err);
  }
})();
