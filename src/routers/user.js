const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')

// User creation endpoint / signup
router.post('/users', async (req, res) => {
  const user = new User(req.body)

  try {
    await user.save()
    sendWelcomeEmail(user.email, user.name)
    const token = await user.generateAuthToken()
    res.status(201).send({ user, token })
  } catch (e) {
    res.status(400).send(e)
  }

  // Promises chaining version in the beginning
  // user
  //   .save()
  //   .then(() => {
  //     res.status(201).send(user)
  //   })
  //   .catch((error) => {
  //     res.status(400).send(error)
  //   })
})

// Endpoint for login
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()
    res.send({ user, token })
  } catch (e) {
    res.status(400).send()
  }
})

// Logout from one instance
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

// Logout all instances
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

// Fetch profile
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user)
})

// Fetch one user is no longer needed, because of route above
// router.get('/users/:id', async (req, res) => {
//   const _id = req.params.id

//   try {
//     const user = await User.findById(_id)
//     res.send(user)
//   } catch (e) {
//     res.status(404).send()
//   }

  // console.log(req.params.id);
  // const _id = req.params.id
  // User.findById(_id)
  //   .then((user) => {
  //     res.send(user)
  //   })
  //   .catch((error) => {
  //     res.status(404).send()
  //   })
// })

// Update user data > own data
router.patch('/users/me', auth, async (req, res) => {
  // const _id = req.user._id // We have access, because of middleware, original: req.params.id
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age']
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
    return res.status(404).send({ error: 'Invalid updates.' })
  }

  try {
    const updatedUser = req.user // we could drop this line and use req.user in the lines below
    updates.forEach((update) => updatedUser[update] = req.body[update])
    await updatedUser.save()
    // for getting middleware running we'll not use this below
    // const updatedUser = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true })

    // we don't need this check anymore
    // if (!updatedUser) {
    //   return res.status(404).send()
    // }
    res.send(updatedUser)
  } catch (e) {
    res.status(400).send(e)
  }
})

// Delete own user profile
router.delete('/users/me', auth, async (req, res) => {
  // const _id = req.user._id // We have access, because of middleware, original was req.params.id with url of /users/:id

  try {
    // const deletedUser = await User.findByIdAndDelete(_id)
    // if (!deletedUser) {
    //   return res.status(404).send()
    // }
    await req.user.remove()
    sendCancelationEmail(req.user.email, req.user.name)
    res.send(req.user)
  } catch (e) {
    res.status(500).send()
  }
})

// Options object for avatars
const upload = multer({
  // dest: 'avatars', We store img data in user
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image in jpg or png format.'))
    }
    cb(undefined, true)
  }
})

// Route for posting avatar
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
  // req.user.avatar = req.file.buffer
  req.user.avatar = buffer
  await req.user.save()
  res.send()
}, (error, req, res, next) => { // express error handling
  res.status(400).send({ error: error.message })
})

// Route for deleting avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined
  await req.user.save()
  res.send()
})

// Fetch avatar
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw new Error()
    }

    res.set('Content-Type', 'image/png')
    res.send(user.avatar)
  } catch {
    res.status(404).send()
  }
})

module.exports = router