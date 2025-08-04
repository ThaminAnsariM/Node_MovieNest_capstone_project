import axios from "axios";
import dotenv from "dotenv";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
dotenv.config();

// now playing

export const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        },
      }
    );
    const movies = data.results;
    res.json({ success: true, movies });
  } catch (error) {
    console.error("Error fetching now playing movies:", error.message);
    if (error.response) {
      console.error("TMDB response data:", error.response.data);
      res.status(error.response.status).json({ success: false, message: error.response.data.status_message || error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
// add new movie to db

export const addShow = async (req, res) => {
  try {
    const { movieId, showInput, showPrice } = req.body;

    let movie = await Movie.findById(movieId);

    if (!movie) {
      const [movieDetailsRes, MovieCreditsRes] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        }),

        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        }),
      ]);

      const movieApiData = movieDetailsRes.data;
      const movieCreditsData = MovieCreditsRes.data;

      console.log(movieApiData.genres);

      const movieDetails = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres,
        casts: movieCreditsData.cast,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || "",
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,
      };

      movie = await Movie.create(movieDetails);
    }

    const showsToCreate = [];

    if (!Array.isArray(showInput)) {
      return res.status(400).json({
        success: false,
        message: "Invalid 'showInput': must be an array of show entries.",
      });
    }

    showInput.forEach((show) => {
      const showDate = show.date;
      if (!Array.isArray(show.time)) {
        console.warn(`Invalid 'time' array in show object:`, show);
        return; // skip this invalid entry
      }

      show.time.forEach((time) => {
        const dateTimeString = `${showDate}T${time}`;
        showsToCreate.push({
          movie: movieId,
          showDateTime: new Date(dateTimeString),
          showPrice,
          occupiedSeats: {},
        });
      });
    });

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }

    res
      .status(200)
      .json({ success: true, message: `Show Added Successfully.` });
  } catch (error) {
    console.error("Error fetching now playing movies:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to get all movie from db

export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .sort({ showDateTime: 1 });

    // Create a map to store unique movies by their ID
    const uniqueMoviesMap = new Map();

    shows.forEach((show) => {
      if (show.movie && !uniqueMoviesMap.has(show.movie._id.toString())) {
        uniqueMoviesMap.set(show.movie._id.toString(), show.movie);
      }
    });

    const uniqueMovies = Array.from(uniqueMoviesMap.values());

    res.status(200).json({ success: true, shows: uniqueMovies });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};


// API to get a single show

export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    // get all upcoming shows for the movie
    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    });
    const movie = await Movie.findById(movieId);
    const dateTime = {};
    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];
      if (!dateTime[date]) {
        dateTime[date] = [];
      }
      dateTime[date].push({ time: show.showDateTime, showId: show._id });
    });
    res.status(200).json({ success: true, movie, dateTime });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};
