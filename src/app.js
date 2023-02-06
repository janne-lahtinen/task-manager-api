const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()

// app.use((req, res, next) => {
//   res.status(503).send('The service is down for the maintenance.')
// })

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

const Task = require('./models/task')
const User = require('./models/user')

module.exports = app