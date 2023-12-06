const auth = require("../../middleware/auth")
const Course = require('../../schemas/courseSchema.js')
const User = require('../../schemas/userSchema.js')
const LSF = require('../../webscraper/lsf.js')

module.exports = app => {
   
    /**
    * GET all courses
    */
    app.get('/study/courses/all', async(req, res) => {
        const courses = await Course.find({}, 'name term lecturer type').lean()
        for (i in courses) {
            courses[i] = {id: courses[i]._id, ...courses[i]}
            delete courses[i]._id
            console.log(courses[i])
        }

        res.status(200).json({courses})
    })
   
    /**
    * GET personal courses
    */
    app.get('/study/courses/personal', auth, async(req, res) => {
        const user_id = req.user_id

        const courses = []
        const registeredCourses = await User.findById(user_id).then(result => result.courses)
        for (const courseId of registeredCourses) {
            var course = await Course.findById(courseId, 'name term lecturer type').lean()
            course = {id: course._id, ...course}
            delete course._id
            courses.push(course)
        }

        res.status(200).json({courses})
    })

    /**
    * GET specific course info
    */
    app.get('/study/courses/info/:courseId', async(req, res) => {
        var courseId = req.params.courseId
        if (courseId == null) return res.status(404).send("Course not found")
        else {
            var course = await Course.findById(courseId).lean()
            course = {id: course._id, ...course}
            delete course._id
            console.log(course)

            res.status(200).json(course)
        }
    })

    /**
     * POST courses of user
     */
    app.post('/study/courses/registration', auth, async(req, res) => {
        
        const user_id = req.user_id

        const user = await User.findOne({ _id: user_id })

        var courseId = req.body.courseId
        if (courseId == null) return res.status(400).send()

        // Append courses id to `courses`
        if (!user.courses.includes(courseId))
            user.courses.push(courseId)

        // Update document
        await user.save()

        res.status(200).send()
    })

    /**
     * DELETE courses of user
     */
    app.delete('/study/courses/registration', auth, async(req, res) => {
        
        const user_id = req.user_id

        const user = await User.findOne({ _id: user_id })

        var courseId = req.body.courseId
        if (courseId == null) return res.status(400).send()

        // Remove courses id from `courses`
        user.courses = user.courses.filter(elem => elem != courseId)

        // Update document
        await user.save()

        res.status(200).send()
    })

    /**
     * (ADMIN) Scrape LSF for one specific course
     */
    app.post('/study/courses/webscrape/:lsfId', auth, async(req, res) => {
        const user_id = req.user_id
        const user = await User.findOne({ _id: user_id })
        if (!user.isAdmin) res.status(403).send()
        else {
            try {
                const result = await LSF.fetchCourseFromId(req.params.lsfId)
    
                await Course.replaceOne({lsf_id: req.params.lsfId}, result, {upsert: true}).exec()
    
                res.status(200).json(result)
            } catch (error) {
                console.error(error)
                res.status(500).send()
            }
        }
    })

    /**
     * (ADMIN) Scrape LSF for multiple courses
     */
    app.post('/study/courses/webscrape', auth, async(req, res) => {
        const user_id = req.user_id
        const user = await User.findOne({ _id: user_id })
        if (!user.isAdmin) res.status(403).send()
        else {
            try {
                const result = await LSF.fetchCoursesFromURL("https://lsf.verwaltung.uni-muenchen.de/qisserver/rds?state=wtree&search=1&trex=step&root120222=617299%7C634263%7C629642%7C624368%7C619041&P.vx=kurz")
    
                for (const course of result) {
                    console.log(course)
                    await Course.replaceOne({lsf_id: course.lsf_id}, course, {upsert: true}).exec()
                }
    
                res.status(200).json(result)
            } catch (error) {
                console.error(error)
                res.status(500).send()
            }
        }
    })
}