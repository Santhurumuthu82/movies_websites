import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse'; // CSV parsing library
import { v4 as uuidv4 } from 'uuid';

const MovieTable = ({
  movies,
  handleEdit,
  handleDelete,
  handleSelectAll,
  handleSelectMovie,
  selectedMovies
}) => {
  return (
    <div>
      {movies.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={movies.length > 0 && selectedMovies.length === movies.length}
                />
              </th>
              <th>Movie Name</th>
              <th>Description</th>
              <th>Rating</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedMovies.includes(movie.id)}
                    onChange={() => handleSelectMovie(movie.id)}
                  />
                </td>
                <td>{movie.movie_name}</td>
                <td>{movie.description}</td>
                <td>{movie.rating}</td>
                <td>
                  <button onClick={() => handleEdit(movie)}>Edit</button>
                </td>
                <td>
                  <button onClick={() => handleDelete(movie.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No movies to display.</p>
      )}
    </div>
  );
};

const MovieList = () => {
  const [movies, setMovies] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [editingMovie, setEditingMovie] = useState(null); // To track which movie is being edited
  const [editedMovieData, setEditedMovieData] = useState({
    movie_name: '',
    description: '',
    rating: ''
  });

  // Fetch movies from backend
  useEffect(() => {
    axios
      .get('http://localhost:5001/movies')
      .then((response) => setMovies(response.data))
      .catch((error) => console.error('Error fetching movies:', error));
  }, []);

  // Handle file upload and parse CSV
  const handleFileUpload = (event) => {
    const file = event.target.files[0]; // Get the first file
    if (!file) {
      console.error('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('myfile', file); // Ensure 'myfile' matches multer config

    axios
      .post('http://localhost:5001/movies/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response) => {
        console.log('File uploaded successfully:', response.data);
        // Optionally fetch the updated movie list
      })
      .catch((error) => {
        console.error('Error uploading file:', error.response || error);
      });
  };

  // Handle single movie deletion
  const handleDelete = (id) => {
    axios
      .delete(`http://localhost:5001/movies/${id}`)
      .then(() => {
        setMovies(movies.filter((movie) => movie.id !== id));
        setSelectedMovies(selectedMovies.filter((movieId) => movieId !== id)); // Remove from selection
      })
      .catch((error) => console.error('Error deleting movie:', error));
  };

  // Handle deleting multiple selected movies
  const handleDeleteSelected = () => {
    const deleteRequests = selectedMovies.map((id) =>
      axios.delete(`http://localhost:5001/movies/${id}`)
    );

    Promise.all(deleteRequests)
      .then(() => {
        setMovies(movies.filter((movie) => !selectedMovies.includes(movie.id)));
        setSelectedMovies([]); // Clear selection
      })
      .catch((error) => console.error('Error deleting selected movies:', error));
  };

  // Select/Unselect all movies
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedMovies(movies.map((movie) => movie.id));
    } else {
      setSelectedMovies([]);
    }
  };

  // Handle individual movie checkbox selection
  const handleSelectMovie = (id) => {
    if (selectedMovies.includes(id)) {
      setSelectedMovies(selectedMovies.filter((movieId) => movieId !== id));
    } else {
      setSelectedMovies([...selectedMovies, id]);
    }
  };

  // Handle when "Edit" is clicked
  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setEditedMovieData({
      movie_name: movie.movie_name,
      description: movie.description,
      rating: movie.rating,
    });
  };

  // Handle input changes for the editing form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedMovieData({
      ...editedMovieData,
      [name]: value,
    });
  };

  // Handle submit of the edited movie
  const handleEditSubmit = () => {
    const updatedMovie = {
      ...editingMovie,
      ...editedMovieData,
    };

    axios
      .put(`http://localhost:5001/movies/${editingMovie.id}`, updatedMovie)
      .then((response) => {
        setMovies(
          movies.map((movie) =>
            movie.id === editingMovie.id ? response.data : movie
          )
        );
        setEditingMovie(null); // Clear the editing state
      })
      .catch((error) => console.error('Error updating movie:', error));
  };

  return (
    <div>
      {/* File Upload */}
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      <button onClick={handleDeleteSelected} disabled={selectedMovies.length === 0}>
        Delete Selected
      </button>

      {/* Movie Table */}
      <MovieTable
        movies={movies}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleSelectAll={handleSelectAll}
        handleSelectMovie={handleSelectMovie}
        selectedMovies={selectedMovies}
      />

      {/* Edit Movie Form */}
      {editingMovie && (
        <div>
          <h3>Edit Movie</h3>
          <form>
            <label>
              Movie Name:
              <input
                type="text"
                name="movie_name"
                value={editedMovieData.movie_name}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Description:
              <input
                type="text"
                name="description"
                value={editedMovieData.description}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Rating:
              <input
                type="text"
                name="rating"
                value={editedMovieData.rating}
                onChange={handleInputChange}
              />
            </label>
            <button type="button" onClick={handleEditSubmit}>
              Save Changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MovieList;
