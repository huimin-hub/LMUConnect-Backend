const auth = require("../middleware/auth")
const User = require('../schemas/userSchema.js')
const GlobalVariable = require('../schemas/globalVariablesSchema.js')

module.exports = app => {
    /**
     * (ADMIN) Set menu items to default
     */
    app.patch('/menu/default', auth, async(req, res) => {
        const user_id = req.user_id
        const user = await User.findOne({ _id: user_id })
        if (!user.isAdmin) res.status(403).send()
        else {
            const value = await GlobalVariable.findOne({ identifier: 'defaultMenuItems' }).then(items => items.value)
            const items = value[0].items
            console.log(items)
            User.updateOne({ _id: user_id }, { menuItems: items })
                .then(() => res.status(201).send('Default Menu Items set for User.'))
                .catch(err => console.error(err))
        }
    })

    /**
    * GET all menu items of user
    */
    app.get('/menu/items', auth, async(req, res) => {
        const user_id = req.user_id

        const items = await User.findOne({ _id: user_id }).then(result => result.menuItems)

        res.status(200).json({items})
    })

    /**
     * PATCH menu items of user
     */
    app.patch('/menu/items', auth, async(req, res) => {
        try {
            const user_id = req.user_id

            const items = await User.findOne({ _id: user_id }).then(result => result.menuItems)

            var index = items.findIndex(item => item.id == req.body.itemId)
            items[index] = {
                "id": req.body.itemId,
                "name": req.body.dataChange.name,
                "url": req.body.dataChange.url,
                "icon": req.body.dataChange.icon,
                "isFavourite": req.body.dataChange.isFavourite,
            }

            User.updateOne({ _id: user_id }, { menuItems: items })
                .then(() => res.status(200).send())
        } catch {
            res.status(400).send('Bad Request')
        }

    })

    /**
     * POST Add new menu item for user
     */
    app.post('/menu/items', auth, async(req, res) => {
        try {
            const user_id = req.user_id

            const items = await User.findOne({ _id: user_id }).then(result => result.menuItems)

            // Validate if the link already exists
            const exists = items.some(item => item.url == req.body.url)
            if (exists) {
                return res.status(409).send('Link already exists')
            }

            let newItem_id = 0
            if (Number(items[items.length - 1].id) < 1000) {
                newItem_id = '1000'
            } else {
                newItem_id = Number(items[items.length - 1].id) + 1
                newItem_id.toString()
            }

            const newItem = {
                "id": newItem_id,
                "name": req.body.name,
                "url": req.body.url,
                "icon": req.body.icon,
                "isFavourite": false
            }

            items.push(newItem)
            User.updateOne({ _id: user_id }, { menuItems: items })
                .then(() => res.status(201).send('Created'))
        } catch {
            res.status(400).send('Bad Request')
        }
    });

    /**
     * DELETE delete menu item for user
     */
    app.delete('/menu/items', auth, async(req, res) => {
        try {
            const user_id = req.user_id

            const items = await User.findOne({ _id: user_id }).then(result => result.menuItems)

            var index = items.findIndex(item => item.id == req.body.itemId)
            items.splice(index, 1)

            User.updateOne({ _id: user_id }, { menuItems: items })
                .then(() => res.status(200).send('OK'))
        } catch {
            res.status(400).send('Bad Request')
        }
    });

}