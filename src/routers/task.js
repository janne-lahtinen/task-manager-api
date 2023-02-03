const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

// Task creation endpoint
router.post('/tasks', auth, async (req, res) => {
  // const task = new Task(req.body)
  const task = new Task({
    ...req.body,
    owner: req.user._id
  })

  try {
    await task.save()
    res.status(201).send(task)
  } catch (e) {
    res.status(400).send(e)
  }
})

// Fetch multiple tasks
// query for filtering GET /tasks?completed=false etc.
// also pagination > limit & skip, GET /tasks?limit=10&skip=20
// sorting GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
  const match = {}
  const sort = {}

  if (req.query.completed) {
    match.completed = req.query.completed === 'true'
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':')
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
  }

  try {
    // const tasks = await Task.find({})
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    })
    res.send(req.user.tasks)
  } catch (e) {
    res.status(500).send(e)
  }
})

// Fetch one task
router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id

  try {
    //const task = await Task.findById(_id)
    const task = await Task.findOne({ _id, owner: req.user._id })
    if (!task) {
      return res.status(404).send()
    }
    res.send(task)
  } catch (e) {
    res.status(404).send(e)
  }
})

// Update task data
router.patch('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id
  const body = req.body
  const updates = Object.keys(body)
  const allowedUpdates = ['description', 'completed']
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
    return res.status(404).send({ error: 'Invalid updates.' })
  }

  try {
    const updatedTask = await Task.findOne({ _id, owner: req.user._id })
    // const updatedTask = await Task.findById(_id)

    // Let's not use the way below to enable possible middelwares
    // const updatedTask = await Task.findByIdAndUpdate(_id, body, { new: true, runValidators: true })

    if (!updatedTask) {
      return res.status(404).send()
    }
    updates.forEach((update) => updatedTask[update] = body[update])
    await updatedTask.save()

    res.send(updatedTask)
  } catch (e) {
    res.status(400).send(e)
  }
})

// Delete one task
router.delete('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id

  try {
    const deletedTask = await Task.findOneAndDelete({ _id, owner: req.user._id})
    if (!deletedTask) {
      return res.status(404).send()
    }
    res.send(deletedTask)
  } catch {
    res.status(500).send()
  }
})

module.exports = router