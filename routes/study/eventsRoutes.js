const { DateTime, Interval } = require("luxon");

const auth = require("../../middleware/auth")
const Course = require('../../schemas/courseSchema.js')
const User = require('../../schemas/userSchema.js')

module.exports = app => {

    /**
    * GET all events today
    */
    app.get('/study/events/today', auth, async(req, res) => {
        const user_id = req.user_id
        const currentDate = DateTime.now().startOf("day")

        const events = await fetchEventsOnDate(user_id, currentDate)

        res.status(200).send({events})
    })

    /**
    * GET all events on specific date
    */
    app.get('/study/events/:date', auth, async(req, res) => {
        const user_id = req.user_id
        const date = DateTime.fromISO(req.params.date)

        const events = await fetchEventsOnDate(user_id, date)

        res.status(200).send({events})
    })

    /**
    * GET all events in specific date range (inclusive)
    */
    app.get('/study/events/:startDate/:endDate', auth, async(req, res) => {
        const user_id = req.user_id
        const startDate = DateTime.fromISO(req.params.startDate)
        const endDate = DateTime.fromISO(req.params.endDate)

        const days = Interval.fromDateTimes(
            startDate.startOf("day"), 
            endDate.endOf("day"))
          .splitBy({ day: 1 }).map(d => d.start);

        const events = []

        for (const date of days) {
            const eventsOnDate = await fetchEventsOnDate(user_id, date)
            events.push(...eventsOnDate)
        }

        res.status(200).send({events})
    })
}

async function fetchEventsOnDate(user_id, date) {
    const events = []

    const registeredCourses = await User.findById(user_id).then(result => result.courses)
    for (const courseId of registeredCourses) {
        const course = await Course.findById(courseId, 'name events type')
        
        for (const event of course.events) {
            const startDate = DateTime.fromISO(event.start_date)
            const endDate = DateTime.fromISO(event.end_date)
            if (startDate <= date && date <= endDate) { // Event is currently in its active period
                let isToday = false
                if (event.frequency == "continous" || event.frequency == "single")
                    isToday = true;
                else {
                    isToday = date.weekday == event.weekday + 1
                
                    if (event.frequency == "biweekly") {
                        const diffInWeeks = Math.round(date.diff(startDate, "weeks").toObject().weeks)
                        if (diffInWeeks % 2 != 0) isToday = false
                    }
                }
                if (isToday) {
                    events.push({
                        course_id: course._id,
                        course_name: course.name,
                        group: event.group,
                        start_time: event.start_time,
                        end_time: event.end_time,
                        is_ct: event.is_ct,
                        date: date.toISODate(),
                        location: event.location,
                        roomfinder_link: event.roomfinder_link,
                        type: event.type
                    })
                }
            }
        }
    }

    return events
}