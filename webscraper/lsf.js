const axios = require("axios")
const cheerio = require("cheerio")
const { permittedCrossDomainPolicies } = require("helmet")
const ISO6391 = require('iso-639-1')

module.exports = {
    fetchCoursesFromURL: fetchCoursesFromURL,
    fetchCourseFromId: fetchCourseFromId
}

async function fetchCoursesFromURL(url) {
    const response = await axios.get(url + "&language=en")
    const html = response.data
    const $ = cheerio.load(html)

    const courses = []
    const promises = []

    $('table[summary="Übersicht über alle Veranstaltungen"] tr').each((i, tableRow) => {
        if (i > 0) {
            const courseURL = $(tableRow).find("a.regular").attr("href")
            const urlParams = new URLSearchParams(courseURL)
            const promise = fetchCourseFromId(urlParams.get("publishid")).then(course => courses.push(course))
            promises.push(promise)
        }
    })

    return await Promise.all(promises).then(() => {
        return courses
    })
}

async function fetchCourseFromId(lsf_id) {
    const course = {lsf_id}

    const response = await axios.get(`https://lsf.verwaltung.uni-muenchen.de/qisserver/rds?state=verpublish&publishid=${lsf_id}&moduleCall=webInfo&publishConfFile=webInfo&publishSubDir=veranstaltung&language=en`)
    const html = response.data
    const $ = cheerio.load(html)

    course.name = $("#detailPage").parent().text().trim().replace(" - Single View", "")
    course.term = $('[headers="basic_5"]').text().toLowerCase().replace(" ", "")
    if (course.term.includes("sose")) course.term = course.term.replace("20", "")
    course.language = ISO6391.getCode($('[headers="basic_16"]').text()).toUpperCase()
    course.lecturer = $('[headers="persons_1"] a').first().text().trim()
    course.max_participants = parseInt($('[headers="basic_8"]').text().trim()) || -1
    course.organisational_unit = $('table[summary="Übersicht über die zugehörigen Einrichtungen"] a').first().text().trim()

    const courseType = $('[headers="basic_1"]').text().toUpperCase().replace(" ", "_")

    // Events
    course.events = []
    $('table[summary="Übersicht über alle Veranstaltungstermine"]').each((i, table) => {
        course.events.push(...getEventsFromTable($, table, courseType, course.term))
    })

    course.type = courseType

    return course
}

function getEventsFromTable($, eventTable, courseType, courseTerm) {
    const events = []

    let group = $(eventTable).find("caption").text().replace("Dates/Times/Location Group: ", "").replace("[-]", "")
    if (group.includes("Gruppe")) group = group.replace("Gruppe", "").trim()
    if (group == "") group = null

    $(eventTable).find("tr").each((i, tableRow) => {
        if (i > 0) {
            const event = {group}

            const weekdays = ["Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat.", "Sun."]
            event.weekday = weekdays.indexOf($($(tableRow).find("td")[1]).text().trim())

            const timeStr = $($(tableRow).find("td")[2]).text().trim()
            const timeParts = timeStr.replace(/\u00a0/g, "").replace("to", "_").replace(" ", "_").split("_")
            event.start_time = getTimeFloatFromString(timeParts[0])
            event.end_time = getTimeFloatFromString(timeParts[1])
            event.is_ct = timeParts[2] == "c.t." // otherwise s.t.

            const frequencies = {woch: "weekly", Einzel: "single", Block: "continuous"} // TODO: biweekly
            event.frequency = frequencies[$($(tableRow).find("td")[3]).text().trim()]

            const dateStr = $($(tableRow).find("td")[4]).text().trim()
            console.log("Date: '" + dateStr + "'")
            if (dateStr != "" && !dateStr.includes("from")) {
                if (event.frequency == "single") {
                    const dateGerman = dateStr.replace(/\u00a0/g, "").replace("at", "")
                    event.start_date = getTechDateFromGermanDate(dateGerman)
                    event.end_date = event.start_date
                } else {
                    const dateParts = dateStr.replace(/\u00a0/g, "").split("to")
                    event.start_date = getTechDateFromGermanDate(dateParts[0])
                    event.end_date = getTechDateFromGermanDate(dateParts[1])
                }
            } else {
                console.log("Using default term dates")
                event.start_date = getDefaultTermStartDate(courseTerm)
                event.end_date = getDefaultTermEndDate(courseTerm)
            }

            event.location = $($(tableRow).find("td")[5]).find("a").first().text().trim()
            event.roomfinder_link = $($(tableRow).find("td")[5]).find("a")[1]?.attribs?.href || null
            
            event.type = courseType

            events.push(event)
        }
    })

    return events
}

function getTimeFloatFromString(timeString) {
    const timeHours = parseInt(timeString.substring(0, 2)) // [HH]:mm)
    const timeMinutes = parseInt(timeString.substring(3, 5)) // mm:[MM]
    const timeMinutesInHours = timeMinutes / 60
    return timeHours + timeMinutesInHours
}

function getTechDateFromGermanDate(germanDate) {
    const dayMonthYear = germanDate.split(".")
    const date = new Date(Date.UTC(dayMonthYear[2], dayMonthYear[1] - 1, dayMonthYear[0]))
    return date.toISOString().split("T")[0]
}

function getDefaultTermStartDate(term) {
    const startDates = {
        sose22: "2022-04-17",
        wise2223: "2022-10-17",
        sose23: "2023-04-17",
        wise2324: "2023-10-16",
        sose24: "2024-04-15",
        wise2425: "2024-10-14"
    }

    return startDates[term]
}

function getDefaultTermEndDate(term) {
    const endDates = {
        sose22: "2022-07-21",
        wise2223: "2023-02-10",
        sose23: "2023-07-21",
        wise2324: "2024-02-09",
        sose24: "2023-07-19",
        wise2425: "2023-02-07"
    }

    return endDates[term]
}