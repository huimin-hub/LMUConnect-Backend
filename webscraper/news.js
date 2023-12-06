const axios = require("axios")
const cheerio = require("cheerio")
const { permittedCrossDomainPolicies } = require("helmet")
const ISO6391 = require('iso-639-1')
//const url = "https://www.lmu.de/en/newsroom/news-overview/index.html"
const http = require('https')
const jsonUrl = "https://www.lmu.de/api/public/prod_newsroom_public/data_all?rep=hal&count=true&hal=f&pagesize=25&page=1&sort=%7B%27date_sort%27:-1%7D&filter=%7B%27$or%27:%20%5B%7B%27category%27:%27news%27%7D,%7B%27category%27:%27video%27%7D,%7B%27category%27:%27socialmedia%27%7D,%7B%27category%27:%27gallery%27%7D%5D%7D&filter=%7B%22$and%22:%5B%7B%22fs_language%22:%7B%22$regex%22:%22EN%22%7D%7D,%7B%22translatedLangs%22:%7B%22$regex%22:%22EN%22%7D%7D,%7B%22formats%22:%7B%22$regex%22:%22nr%22%7D%7D%5D%7D"

module.exports = {
    fetchNewsFromJson: fetchNewsFromJson,
}

/** DEPRECATED 
async function scrapeNews() {
    const response = await axios.get(url)
    const html = response.data
    const $ = cheerio.load(html)

    const newsList = []
    //const loadMore = $('.filterable-list__load-more-wrapper')

    var result = $("ul.filterable-list__list li")
    result.each((index, elem) => {
    
        const news = {}
        news.link = $(elem).find("a.filterable-list__list-item-link.is-news").attr("href")
        news.title = $(elem).find("a.filterable-list__list-item-link.is-news").text()
        news.abstract = $(elem).find("p.filterable-list__list-item-description").text()
        news.date = $(elem).find("em.filterable-list__list-item-meta-category")

        newsList.push(news)
        
    })

    return newsList
}*/

async function fetchNewsFromJson() {
    const response = await axios.get(jsonUrl)
    var json = response.data
    console.log("Got a response: ", json);

    const newsList = []
    for (let i = 0; i < 5; i++) {
        const news = {}
        news._id = json._embedded["rh:doc"][i].id
        news.title = json._embedded["rh:doc"][i].link.text
        news.abstract = json._embedded["rh:doc"][i].description
        news.link = json._embedded["rh:doc"][i].link.href
        news.date = json._embedded["rh:doc"][i].date
        news.imageUrl = json._embedded["rh:doc"][i].image?.content.fallbackSrc
        if (news.imageUrl == undefined) news.imageUrl = ""
        newsList.push(news)
    }
    return newsList
}
