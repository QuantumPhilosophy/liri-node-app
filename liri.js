'use strict'

require('dotenv').config()
const fs = require('fs')
const keys = require('./keys.js')
const axios = require('axios')
const moment = require('moment')
const Spotify = require('node-spotify-api')
const spotify = new Spotify({
  id: keys.spotify.id,
  secret: keys.spotify.secret
})

// User Input Controller
function commander (userInput) {
  if (userInput[0] === 'concert-this') {
    bandsInTownThisArtist(userInput)
  } else if (userInput[0] === 'spotify-this-song') {
    spotifyThisSong(userInput)
  } else if (userInput[0] === 'movie-this') {
    omdbThisMovie(userInput)
  } else if (userInput[0] === 'do-what-it-says') {
    doWhatItSays()
  } else {
    console.log('------------------------------------')
    console.log('Opps! Try a command:\nconcert-this {artist/band name}\nspotify-this-song {song name}\nmovie-this {movie name}\ndo-what-it-says')
    console.log('------------------------------------')
  }
}

// node liri.js concert-this '<artist/band name here>'
function bandsInTownThisArtist (artistNameStrings) {
  const bandsInTownKey = keys.omdb.key
  const artistName = getAllTheStrings(artistNameStrings).replace(/^"(.*)"$/, '$1')

  // This will search the Bands in Town Artist Events API
  axios.get('https://rest.bandsintown.com/artists/' + artistName + '/events?app_id=' + bandsInTownKey)
    .then(response => {
      const responseData = response.data
      if (responseData.length <= 0) {
        console.log('------------------------------------')
        console.log('No events for ' + artistName)
        console.log('------------------------------------')
      } else {
        // Render the following information about each event to the terminal
        responseData.forEach(dataItem => {
          let displayRegion = dataItem.venue.region
          if (!displayRegion) {
            displayRegion = dataItem.venue.country
          }
          console.log('------------------------------------')
          console.log('Artist Name:', artistName)
          console.log('Venue Name:', dataItem.venue.name)
          console.log('Venue City:', dataItem.venue.city)
          console.log('Venue Region:', displayRegion)
          console.log('Event Date:', moment(dataItem.datetime).format('MM/DD/YYYY'))
          console.log('------------------------------------')
        })
      }
    })
}

// node liri.js spotify-this-song '<song name here>'
function spotifyThisSong (songNameStrings) {
  let songName = getAllTheStringsForSpotify(songNameStrings).replace(/^"(.*)"$/, '$1')

  // If no song is provided then your program will default to 'Bohemian Rhapsody' by Queen.
  if (!songName) {
    songName = 'Bohemian Rhapsody'
  }

  spotify.search({ type: 'track', query: songName }, (err, response) => {
    if (err) {
      return console.log('Error occurred: ' + err)
    }

    let responseData = response.tracks.items
    responseData.forEach(album => {
      let previewUrl = album.preview_url
      if (!previewUrl) {
        previewUrl = 'Sorry no Preview URL for ' + songName + '. Blame Spotify.'
      }

      // This will show the following information about the song in the terminal
      console.log('------------------------------------')
      console.log('Song Name:', songName)
      console.log('Artist Name:', album.artists[0].name)
      console.log('Preview Url:', previewUrl)
      console.log('Album Name:', album.name)
      console.log('------------------------------------')
    })
  })
}

// node liri.js movie-this '<movie name here>'
function omdbThisMovie (movieNameStrings) {
  const omdbKey = keys.omdb.key
  let movieName = getAllTheStrings(movieNameStrings).replace(/^"(.*)"$/, '$1')

  // If the user doesn't type a movie in, the program will output data for the movie 'The Boondock Saints'
  if (!movieName) {
    movieName = 'The Boondock Saints'
  }

  // This will search OMDB API
  axios.get('http://www.omdbapi.com/?t=' + movieName + '&y=&plot=short&apikey=' + omdbKey)
    .then(response => {
      let ratings = response.data.Ratings
      let imdbRating = ratings.find(Source => Source.Source === 'Internet Movie Database')
      let rottenTomatoesRating = ratings.find(Source => Source.Source === 'Rotten Tomatoes')

      // This will output the following information to your terminal
      console.log('------------------------------------')
      console.log('Movie Name:', movieName)
      console.log('IMDB Rating:', imdbRating.Value)
      console.log('Rotten Tomatoes Rating:', rottenTomatoesRating.Value)
      console.log('The Country:', response.data.Country)
      console.log('The Language:', response.data.Language)
      console.log('The Plot:', response.data.Plot)
      console.log('The Actors:', response.data.Actors)
      console.log('------------------------------------')
    })
}

// node liri.js do-what-it-says
// Using the fs Node package, LIRI will take the text inside of random.txt and then use it to call one of LIRIs commands.
function doWhatItSays () {
  fs.readFile('./random.txt', 'utf8', function (error, data) {
    const commanderInput = data.split(',')
    if (error) {
      return console.log(error)
    }
    commander(commanderInput)
  })
}

// Functions for parsing args into a URL encoded string
function getAllTheStrings (processToParse) {
  let allTheStrings = ''
  for (var i = 1; i < processToParse.length; i++) {
    if (i > 1 && i < processToParse.length) {
      allTheStrings = allTheStrings + '+' + processToParse[i]
    } else {
      allTheStrings += processToParse[i]
    }
  }
  return allTheStrings
}

// Functions for parsing args into a string
function getAllTheStringsForSpotify (processToParse) {
  let allTheStrings = ''
  for (var i = 1; i < processToParse.length; i++) {
    if (i > 1 && i < processToParse.length) {
      allTheStrings = allTheStrings + ' ' + processToParse[i]
    } else {
      allTheStrings += processToParse[i]
    }
  }
  return allTheStrings
}

commander(process.argv.slice(2))
