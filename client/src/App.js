import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MovieList from './components/MovieList';
import AddMovieForm from './components/AddMovieForm';
const API_URL = 'http://localhost:5001/movies';

function App() {
  const [movies, setMovies] = useState([]);

  // Fetch movies from the backend
  const fetchMovies = async () => {
    try {
      const res = await axios.get(API_URL);
      console.log("Fetched Movies: ", res.data); // Log fetched movies
      setMovies(res.data);
    } catch (error) {
      console.error("Error fetching movies:", error.response ? error.response.data : error.message);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const addMovie = async (newMovie) => {
    try {
      console.log("Sending movie data:", newMovie);  // Log movie data to be sent

      const response =await axios.post("http://localhost:5001/movies/", newMovie, {
        headers: {
          'Content-Type': 'application/json' // Ensure JSON header is set
        }
      });
 
      console.log("Response from server (POST):", response.data);  // Log server response
      fetchMovies(); // Refresh movie list after successfully adding a movie
    } catch (error) {
      console.error("There was an error adding the movie:", error.response ? error.response.data : error.message);
    }
  };

  const editMovie = async (id, updatedMovie) => {
    try {
      console.log("Updating movie with id:", id, "Data:", updatedMovie);  // Log update attempt

      const response = await axios.put(`${API_URL}/${id}`, updatedMovie, {
        headers: {
          'Content-Type': 'application/json' // Ensure JSON header is set for PUT as well
        }
      });

      console.log("Response from server (PUT):", response.data);  // Log server response
      fetchMovies(); // Refresh movie list after updating
    } catch (error) {
      console.error("There was an error updating the movie:", error.response ? error.response.data : error.message);
    }
  };

  const deleteMovie = async (id) => {
    try {
      console.log("Deleting movie with id:", id);  // Log delete attempt

      const response = await axios.delete(`${API_URL}/${id}`);
      console.log("Response from server (DELETE):", response.data);  // Log server response
      fetchMovies(); // Refresh movie list after deleting
    } catch (error) {
      console.error("There was an error deleting the movie:", error.response ? error.response.data : error.message);
    }
  };

  return (
    <div className="App">
      <h1>Movie App</h1>
      <AddMovieForm addMovie={addMovie} />
      <MovieList movies={movies} editMovie={editMovie} deleteMovie={deleteMovie} />
      
    </div>
  );
}

export default App;
