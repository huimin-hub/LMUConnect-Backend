const cors = require('cors')
const User = require('../schemas/userSchema')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const auth = require("../middleware/auth")
const config = require('../config.js')
const GlobalVariable = require('../schemas/globalVariablesSchema.js')
const utf8 = require('utf8');
const crypto = require('crypto')
const Matrix = require('matrix-js-sdk')

function computeHMAC(nonce, user, password, shared_secret) {
    const hmac = crypto.createHmac('sha1', shared_secret);
    hmac.update(nonce);
    hmac.update(Buffer.from([0x00]));
    hmac.update(utf8.encode(user));
    hmac.update(Buffer.from([0x00]));
    hmac.update(utf8.encode(password));
    hmac.update(Buffer.from([0x00]));
    hmac.update('notadmin');

    return hmac.digest('hex');
}

module.exports = app => {
    /**
     * Adds a User to the database
     */
    app.post('/auth/signup', cors(), async(req, res) => {
        try {
            const email = req.body.email
            const password = req.body.password

            // Validate if user exist in our database
            const oldUser = await User.findOne({ email: req.body.email })
            if (oldUser) {
                return res.status(409).send("User Already Exist. Please Login")
            }

            // Create the encrypted password
            const salt = await bcrypt.genSalt()
            const hashedPassword = await bcrypt.hash(req.body.password, salt)

            // Get default menu items
            const value = await GlobalVariable.findOne({ identifier: 'defaultMenuItems' }).then(variable => variable.value)
            const items = value[0].items

            const profile = await GlobalVariable.findOne({ identifier: 'defaultProfile' }).then(variable => variable.value)
            profile[0].name = req.body.name

            // Matrix Registration
            const matrix_username = email.split('@')[0];
            const matrix_id = '@' + matrix_username + ':msp-ws2223-4.dev.mobile.ifi.lmu.de'
            const requestBody = {
                identifier: {
                    type: "m.id.user",
                    user: config.mname
                },
                initial_device_display_name: "Server request",
                password: config.mpassword,
                type: "m.login.password"
            }

            // Admin Login Request
            const Rawresponse = await fetch('https://msp-ws2223-4.dev.mobile.ifi.lmu.de/_matrix/client/v3/login', {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const response = await Rawresponse.json();

            // Create Matrix Client 
            const client = Matrix.createClient({
                baseUrl: 'https://msp-ws2223-4.dev.mobile.ifi.lmu.de',
                accessToken: response.access_token,
                userId: response.user_id
            });

            // Register a new User with parameters
            client.register(
                matrix_username,
                password,
                null, {
                    session: undefined,
                    type: "m.login.dummy"
                },
                false,
                undefined,
                undefined
            )

            let user = await User.create({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
                token: '',
                menuItems: items,
                courses: [],
                profile: profile[0],
                friendsList: [],
                matrix: {
                    name: matrix_username,
                    password: hashedPassword,
                    id: matrix_id
                },
                isAdmin: false
            })

            // Create token
            const token = jwt.sign({ user_id: user.id, email },
                config.secret, {
                    expiresIn: "365d",
                }
            );
            // Save user token
            user.token = token;

            user.save()
                .then(() => res.status(201).json({ auth_token: token }))
                .catch(err => console.error(err))
        } catch (e) {
            res.status(500).send(e.message)
        }
    })

    app.post('/register', async(req, res) => {
        const requestBody = {
            identifier: {
                type: "m.id.user",
                user: config.mname
            },
            initial_device_display_name: "Server request",
            password: config.mpassword,
            type: "m.login.password"
        }

        const Rawresponse = await fetch('https://msp-ws2223-4.dev.mobile.ifi.lmu.de/_matrix/client/v3/login', {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const response = await Rawresponse.json();


        const client = Matrix.createClient({
            baseUrl: "https://msp-ws2223-4.dev.mobile.ifi.lmu.de",
            accessToken: response.access_token,
            userId: response.user_id
        });

        client.register(
            'pepper_oni',
            'pizza',
            null, {
                session: undefined,
                type: "m.login.dummy"
            },
            false,
            undefined,
            undefined
        ).then(res.status(200).send('Ok'))
    })

    /**
     * Login and authentication of a user
     */
    app.post('/auth/login', async(req, res) => {
        const user = await User.findOne({ email: req.body.email })
        if (user == null) {
            return res.status(400).send('Cannot find user')
        }
        try {
            const email = req.body.email

            if (await bcrypt.compare(req.body.password, user.password)) {
                // Create token
                /**const token = jwt.sign({ user_id: user._id, email },
                    config.secret, {
                        expiresIn: "365d",
                    }
                );
                // Save user token
                user.token = token;
                user.save()
                    .then(() => res.status(200).json({auth_token: token}))
                    .catch(err => console.log(err))*/

                res.status(200).json({
                    auth_token: user.token,
                    matrixName: user.matrix.name,
                    matrixPassword: user.matrix.password,
                    matrixId: user.matrix.id
                })
            } else {
                res.status(403).send('Not Allowed')
            }
        } catch {
            res.status(500).send()
        }
    })

    /**
     * Find all Users (dev purpose only for now)
     */
    app.get('/allusers', (req, res) => {
        console.log('all uSER')
        User.find().then(users => {
            res.send(users)
        }, err => console.error(err))
    })

    /**
     * GET user id
     */
    app.get('/userid/:email', async(req, res) => {
        try {
            const id = await User.findOne({ email: req.params.email }).then(user => user._id)
            res.status(200).send({ id: id })
        } catch {
            res.status(400).send("Could not find E-Mail!")
        }
    })

    /**
     * GET username using email
     */
    app.get('/username/:email', async(req, res) => {
        try {
            const name = await User.findOne({ email: req.params.email }).then(user => user.name)
            res.status(200).send({ name: name })
        } catch {
            res.status(400).send("Could not find E-Mail!")
        }
    })

    /**
     * GET username using matrix id
     */
    app.get('/name/:matrixId', async(req, res) => {
        try {
            const name = await User.findOne({ 'matrix.id': req.params.matrixId }).then(user => user.name)
            res.status(200).send({ name: name })
        } catch {
            res.status(400).send("Could not find ID!")
        }
    })

    /**
     * GET useremail using matrix id
     */
    app.get('/email/:matrixId', async(req, res) => {
        try {
            const email = await User.findOne({ 'matrix.id': req.params.matrixId }).then(user => user.email)
            res.status(200).send({ email: email })
        } catch {
            res.status(400).send("Could not find ID!")
        }
    })

    /**
     * GET matrix id using email
     */
    app.get('/matrixid/:email', auth, async(req, res) => {
        try {
            const matrix_id = await User.findOne({ email: req.params.email }).then(user => user.matrix.id)

            if (matrix_id == null) {
                res.status(400).send('Cannot find user')
            } else { res.status(200).json({ matrixId: matrix_id }) }


        } catch {
            res.status(400).send('Bad Request')

        }
    })

    /**
     * Test Authentication (dev purpose only for now)
     */
    app.post('/welcome', auth, async(req, res) => {
        console.log("Welcome here.")
        try {
            const user_id = req.user_id
            const user = await User.findOne({ _id: user_id })
            console.log(user)

            const user_name = user.name

            res.status(200).send(user_name);
        } catch {
            res.status(500).send()
        }
    });
}