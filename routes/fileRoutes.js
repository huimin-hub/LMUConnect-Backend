//const upload = require('../middleware/upload')
const auth = require("../middleware/auth")
const GridFSBucket = require("mongodb").GridFSBucket;
const MongoClient = require("mongodb").MongoClient;
const config = require('../config')
const FileChunks = require('../schemas/photoChunksSchema');
const User = require('../schemas/userSchema');
const path = require('path')

const multer = require('multer')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './files')
    },
    filename: (req, file, cb) => {
        console.log(file)
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({ storage: storage })

module.exports = app => {
    /**
     * POST Image onto Server
     */
    app.post('/image', upload.single("image"), auth, (req, res) => {
        const user_id = req.user_id

        res.status(200).send('Image uploaded')
    })

    /**
     * GET Image on Server
     */
    app.get('/image/:email', async(req, res) => {

        const image = await User.findOne({ email: req.params.email }).then(user => user.profile.picture)
        const path = config.dir + "/files/" + image

        res.status(200).sendFile(path)
    })

    /**
    app.post('/image/pb', async(req, res) => {
        try {
            const id = await User.findOne({ email: req.body.email }).then(user => user.profile.picture)

            const chunk = await FileChunks.findById(id).then(file => file.data)
            chunk.toString('base64')
            console.log(typeof(chunk))
            console.log(chunk)
            res.status(200).send(chunk)

        } catch (error) {
            return res.status(500).send('Bad request')
        }
    })**/
}