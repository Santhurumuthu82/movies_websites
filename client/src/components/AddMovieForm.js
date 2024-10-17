import React, { useState } from 'react';


const AddMovieForm = ({ addMovie }) => {
  // Corrected field names to match server's expected keys
  const [newMovie, setNewMovie] = useState({ Movie_Name: '', Description: '', Rating: '' });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation to ensure no fields are empty
    if (!newMovie.Movie_Name || !newMovie.Description || !newMovie.Rating) {
      alert("Please fill in all fields");
      return;
    }

    // Call addMovie with the new movie data
    addMovie(newMovie);

    // Reset the form after submission
    setNewMovie({ Movie_Name: '', Description: '', Rating: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Movie Name"
        value={newMovie.Movie_Name}  // Use correct state key (Movie_Name)
        onChange={(e) => setNewMovie({ ...newMovie, Movie_Name: e.target.value })}
      />
      <input
        type="text"
        placeholder="Description"
        value={newMovie.Description}  // Use correct state key (Description)
        onChange={(e) => setNewMovie({ ...newMovie, Description: e.target.value })}
      />
      <input
        type="number"
        placeholder="Rating"
        value={newMovie.Rating}  // Use correct state key (Rating)
        onChange={(e) => setNewMovie({ ...newMovie, Rating: e.target.value })}
      />
      <button type="submit">Add Movie</button>
    </form>
  );
};

export default AddMovieForm;
