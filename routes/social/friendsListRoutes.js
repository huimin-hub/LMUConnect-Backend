const auth = require("../../middleware/auth")
const User = require('../../schemas/userSchema.js')

module.exports = app => {


    /**
     * GET friendsList of user
     */
    app.get('/social/friendsList', auth, async(req, res) => {
        try {
            const user_id = req.user_id

            const friends = []

            const friendsList = await User.findById(user_id).then(result => result.friendsList)

            for (const friendsId of friendsList) {
                console.log(friendsId)
                var friend = friendsId
                friends.push(friend)

            }

            res.status(200).json({ friends })
        } catch {
            res.status(400).send("Bad request")
        }
    })



    /**
     * POST friendsList of user
     */
    app.post('/social/friendsList', auth, async(req, res) => {

        const user_id = req.user_id

        const user = await User.findOne({ _id: user_id })

        const addedFriend = await User.findOne({ email: req.body.email })

        if (addedFriend == null) {

            return res.status(400).send('Cannot find user')

        }
        try {

            const friendId = addedFriend._id.toString()

            // Append this friend id to `friendsList`
            if (!user.friendsList.includes(friendId)) {
                user.friendsList.push(friendId)
            } else {
                return res.status(400).send('user was already your friend')
            }

            // Update document
            await user.save()


            res.status(200).send({
                name: addedFriend.name,
                matrixId: addedFriend.matrix.id
            })

        } catch {

            res.status(400).send('Bad Request')

        }

    })

    /**
     * DELETE friend of friendsList
     */
    app.delete('/social/friendsList', auth, async(req, res) => {

        const user_id = req.user_id

        const user = await User.findOne({ _id: user_id })

        var friendId = req.body.friendId
        if (friendId == null) return res.status(400).send()

        // Remove courses id from `courses`
        user.friendsList = user.friendsList.filter(elem => elem != friendId)

        // Update document
        await user.save()

        res.status(200).send()
    })


}