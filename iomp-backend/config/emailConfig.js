module.exports = {
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    templates: {
      spendingAlert: './templates/spendingAlert.html'
    }
  };