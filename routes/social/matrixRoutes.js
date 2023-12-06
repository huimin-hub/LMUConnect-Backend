const auth = require("../../middleware/auth")
const User = require('../../schemas/userSchema.js')
const Matrix = require('matrix-js-sdk')

module.exports = app => {

    /**
     * GET Matrix Credentials
     */
    app.get('/matrix/login', auth, async(req, res) => {
            try {
                const user_id = req.user_id

                const credentials = await User.findById(user_id).then(user => user.matrix)

                res.status(200).json(credentials)
            } catch {
                res.status(400).send("Bad Request")
            }
        })
        /**
         * GET Room Parameters for creating a new Room
         */
    app.get('/matrix/roomParams', async(req, res) => {
        try {
            const email = req.body.email

            const user = await User.findOne({ email: email })

            const response = {
                roomname: user.name,
                user: user.matrix.name
            }

            res.status(200).json(response)
        } catch {
            res.status(400).send("Bad Request")
        }
    })

    app.post('/matrix/joinRoom', async(req, res) => {
        try {
            const roomId = req.body.roomId
            const credentials = await User.findOne({ email: req.body.email }).then(user => user.matrix)
            let token = ""

            const requestBody = {
                identifier: {
                    type: "m.id.user",
                    user: credentials.name
                },
                initial_device_display_name: "Server request",
                password: credentials.password,
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
                userId: credentials.name
            });

            client.register()
            client.joinRoom(roomId).then(
                res.status(200).send(response.body.access_token),
                error => res.status(404).send(error)
            )
        } catch (e) {
            res.status(400).send(e)
        }
    })

    app.post('/matrix/member', auth, async(req, res) => {
        try {

            const user_id = req.user_id

            const name = await User.findById(user_id).then(user => user.name)

            const matrix_ids = req.body.matrix_ids

            if (matrix_ids.length === 0)
                res.status(200).send([name])

            const result = []
            result.push(name)

            var counter = 0

            matrix_ids.forEach(async element => {
                const user = await User.findOne({ 'matrix.id': element }).then(u => u.name)
                result.push(user)
                counter++
                if (counter == matrix_ids.length) res.status(200).json({ memberList: result })
            })

        } catch {
            res.status(400).send("Could not find Group Member")
        }
    })


}