const ContactMessage = require('../models/ContactMessage')
const { sendEmail } = require('../utils/email')

const sendContactMessage = async (req, res, next) => {
  try {
    const { name, email, message } = req.body
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' })
    }

    const contactMessage = await ContactMessage.create({ name, email, message })

    await sendEmail({
      to: process.env.CONTACT_RECEIVER || 'hello@delxta.com',
      subject: 'New Contact Message - Delxta',
      html: `<p><strong>From:</strong> ${name} (${email})</p><p>${message}</p>`,
    })

    return res.status(201).json({
      message: 'Message sent successfully.',
      contactMessage,
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = { sendContactMessage }
