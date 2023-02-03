const mongoose = require('mongoose')

const connectionURL = process.env.MONGODB_URL
mongoose.set("strictQuery", false)

mongoose.connect(connectionURL, {
  useNewUrlParser: true
})