const auth = require("../middleware/auth")
const News = require('../schemas/newsSchema.js')
const User = require('../schemas/userSchema')
const NewsScraper = require('../webscraper/news.js')

module.exports = app => {
    /**
    * GET the news feed
    */
    app.get('/home/news', async(req, res) => {
        const news = await News.find().lean()

        res.status(200).json({news})
    })

    /**
     * (ADMIN) Scrape news from LMU news page
     */
     app.post('/home/news/webscrape', auth, async(req, res) => {
        const user_id = req.user_id
        const user = await User.findOne({ _id: user_id })
        if (!user.isAdmin) res.status(403).send()
        else {
            try {
                const result = await NewsScraper.fetchNewsFromJson()
    
                for (const news of result) {
                    console.log(news)
                    await News.replaceOne({_id: news._id}, news, {upsert: true}).exec()
                }
    
                res.status(200).json(result)
            } catch (error) {
                console.error(error)
                res.status(500).send()
            }
        }
    })
}