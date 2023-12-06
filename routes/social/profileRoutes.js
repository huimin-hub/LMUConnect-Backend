const Link = require('../../schemas/linkSchema.js')
const auth = require("../../middleware/auth")
const User = require('../../schemas/userSchema.js')
const GlobalVariable = require('../../schemas/globalVariablesSchema.js')

module.exports = app => {
    /**
     * GET Profile values by user id
     */
    app.get('/profile', auth, async(req, res) => {
        try {
            const user_id = req.user_id

            const user = await User.findOne({ _id: user_id })

            const profile = {
                name: user.profile.name,
                email: user.email,
                school: user.profile.school,
                major: user.profile.major,
                degree: user.profile.degree,
                phone: user.profile.phone,
                social: {
                    discord: user.profile.social.discord,
                    github: user.profile.social.github,
                    instagram: user.profile.social.instagram
                },
                picture: user.profile.picture
            }


            res.status(200).json(profile)
        } catch {
            res.status(400).send('Bad Request')
        }
    })

    /**
     * GET other's profile values by name
     */

    app.get('/profile/others/:name', async(req, res) => {
        try {

            const others = await User.findOne({ name: req.params.name })
            if (others == null) {
                res.status(404).send("Profile does not exist")
            } else {
                const profile = {
                    id: others._id,
                    name: others.profile.name,
                    email: others.email,
                    school: others.profile.school,
                    major: others.profile.major,
                    degree: others.profile.degree,
                    phone: others.profile.phone,
                    social: {
                        discord: others.profile.social.discord,
                        github: others.profile.social.github,
                        instagram: others.profile.social.instagram
                    },
                    picture: others.profile.picture
                }
            
                res.status(200).json(profile)
            }
        } catch {
            res.status(400).send('Bad Request')
        }
    })


    app.post('/profile/others', async(req, res) => {
        try {

            const others = await User.findOne({ name: req.body.name })

            const profile = {
                name: others.profile.name,
                email: others.email,
                school: others.profile.school,
                major: others.profile.major,
                degree: others.profile.degree,
                phone: others.profile.phone,
                social: {
                    discord: others.profile.social.discord,
                    github: others.profile.social.github,
                    instagram: others.profile.social.instagram
                },
                picture: others.profile.picture
            }

            //res.status(200).json(profile)
            res.status(400).send(profile)

        } catch {
            res.status(400).send('Bad Request')
        }
    })


    /**
     * PATCH Profile values
     */
    app.patch('/profile', auth, async(req, res) => {
        try {
            const user_id = req.user_id

            const profile = await User.findOne({ _id: user_id }).then(user => user.profile)


            var changes = {
                name: req.body.name,
                school: req.body.school,
                major: req.body.major,
                degree: req.body.degree,
                phone: req.body.phone,
                social: {
                    discord: req.body.discord,
                    github: req.body.github,
                    instagram: req.body.ins
                },
                picture: req.body.picture
            }

            // Validate profile
            if (changes.name == null || changes.name == "") {
                changes.name = profile.name
            }
            if (changes.school == null || changes.school == "") {
                changes.school = profile.school
            }
            if (changes.major == null || changes.major == "") {
                changes.major = profile.major
            }
            if (changes.degree == null || changes.degree == "") {
                changes.degree = profile.degree
            }
            if (changes.phone == null || changes.phone == "") {
                changes.phone = profile.phone
            }
            if (changes.picture == null || changes.picture == "") {
                changes.picture = profile.picture
            }

            // Validate social
            if (changes.social.github == null || changes.social.github == "") {
                changes.social.github = profile.social.github
            }
            if (changes.social.discord == null || changes.social.discord == "") {
                changes.social.discord = profile.social.discord
            }
            if (changes.social.instagram == null || changes.social.instagram == "") {
                changes.social.instagram = profile.social.instagram
            }

            User.updateOne({ _id: user_id }, { profile: changes })
                .then(() => res.status(200).send('Profile changed.'))
                .catch(err => console.error(err))

        } catch {
            res.status(400).send('Bad Request')
        }

    })

}