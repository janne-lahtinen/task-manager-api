const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'janne.lahtinen@exove.com',
    subject: 'Thanks for joining in!',
    text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
  })
}

const sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'janne.lahtinen@exove.com',
    subject: 'Sorry to see you go!',
    text: `Goodbye, ${name}. Is there something, that we could have done better, to get you to stay?`
  })
}

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail
}