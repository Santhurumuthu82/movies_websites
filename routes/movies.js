import express from "express";
import { v4 as uuidv4 } from "uuid";
import pg from "pg"; // Import the entire pg module
import multer from 'multer'; // For file uploads
import csvParser from 'csv-parser'; // To parse CSV file
import fs from 'fs'; // Import fs for file system operations

const app = express();
const { Pool } = pg;
const router = express.Router();

// Create a PostgreSQL client
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "movies_db",
  password: "123456",
  port: 5432,
});

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' }).single('myfile');

// GET all movies
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM movies");
    res.send(result.rows);
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).send("Server error");
  }
});

// GET a specific movie by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM movies WHERE id = $1", [id]);
    const foundMovie = result.rows[0];
    res.send(foundMovie || "Movie not found");
  } catch (error) {
    console.error("Error fetching movie:", error);
    res.status(500).send("Server error");
  }
});

// DELETE a movie by id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM movies WHERE id = $1 RETURNING *", [id]);
    const deletedMovie = result.rows[0];
    if (deletedMovie) {
      res.send(`Movie ${deletedMovie.Movie_Name} deleted!`);
    } else {
      res.send("Movie not found");
    }
  } catch (error) {
    console.error("Error deleting movie:", error);
    res.status(500).send("Server error");
  }
});

// DELETE multiple movies
router.delete("/delete-multiple", async (req, res) => {
  const { ids } = req.body; // Expect an array of movie IDs
  try {
    const result = await pool.query("DELETE FROM movies WHERE id = ANY($1::uuid[]) RETURNING *", [ids]);
    const deletedMovies = result.rows;
    if (deletedMovies.length > 0) {
      res.send(`Deleted ${deletedMovies.length} movies successfully`);
    } else {
      res.status(404).send("Movies not found");
    }
  } catch (error) {
    console.error("Error deleting movies:", error);
    res.status(500).send("Server error");
  }
});

// PATCH (update) a movie by id
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { Movie_Name, Description, Rating } = req.body;

  try {
    const result = await pool.query("SELECT * FROM movies WHERE id = $1", [id]);
    const updatedMovie = result.rows[0];
    
    if (!updatedMovie) {
      return res.status(404).send("Movie not found");
    }

    const updatedFields = {};
    if (Movie_Name) updatedFields.Movie_Name = Movie_Name;
    if (Description) updatedFields.Description = Description;
    if (Rating) updatedFields.Rating = Rating;

    const updates = Object.keys(updatedFields)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ");
    
    const values = [id, ...Object.values(updatedFields)];

    await pool.query(`UPDATE movies SET ${updates} WHERE id = $1`, values);
    
    res.send(`Movie ${updatedFields.Movie_Name || updatedMovie.Movie_Name} has been updated`);
    
  } catch (error) {
    console.error("Error updating movie:", error);
    res.status(500).send("Server error");
  }
});

// PUT (update) a movie by id
router.put('/:id', async (req, res) => {
  const { id } = req.params; // Get movie ID from the URL
  const { movie_name, description, rating } = req.body; // Get the updated movie data

  try {
    // Check if the movie exists
    const checkMovie = await pool.query('SELECT * FROM movies WHERE id = $1', [id]);
    if (checkMovie.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Update the movie in the database
    const updatedMovie = await pool.query(
      'UPDATE movies SET movie_name = $1, description = $2, rating = $3 WHERE id = $4 RETURNING *',
      [movie_name, description, rating, id]
    );

    res.json(updatedMovie.rows[0]); // Return the updated movie
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Bulk upload movies using a CSV file
// POST a new movie
router.post("/", async (req, res) => {
  const { movie_name, description, casting } = req.body;
  if (!movie_name || !description || !casting) {
    return res.status(400).send({ message: "All fields are required" });
  }
  
  const id = uuidv4(); 
  try {
    const result = await pool.query(
      "INSERT INTO movies (id, movie_name, description, casting) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, movie_name, description, casting]
    );    
    res.json({ message: "Movie added successfully", movie: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Bulk upload movies using a CSV file
// Bulk upload movies using a CSV file
router.post('/upload', upload, async (req, res) => {
  const results = [];

  // Ensure that a file was uploaded
  if (!req.file) {
    console.error('No file uploaded');
    return res.status(400).send('No file uploaded.');
  }

  // Logging for file upload
  console.log('File uploaded:', req.file.path);

  // Create a read stream from the uploaded file and parse the CSV
  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on('data', (row) => {
      const { movie_name, description, rating } = row;

      // Check for missing or invalid fields
      if (!movie_name || !description || !rating || movie_name.trim() === "" || description.trim() === "" || rating.trim() === "") {
        console.error(`Invalid record: ${JSON.stringify(row)} - Skipping.`);
        return; // Skip invalid rows
      }

      // If the record is valid, log it and add it to the array
      console.log('Valid record:', row);
      results.push({
        id: uuidv4(), // Generate unique ID for each movie
        movie_name,
        description,
        rating
      });
    })
    .on('end', async () => {
      // Insert all valid records into the database once the CSV is fully parsed
      try {
        const insertPromises = results.map(async (record) => {
          return pool.query(
            'INSERT INTO movies (id, Movie_Name, Description, Rating) VALUES ($1, $2, $3, $4)',
            [record.id, record.movie_name, record.description, record.rating]
          );
        });

        await Promise.all(insertPromises); // Wait for all insertions to complete

        console.log('All records inserted successfully');
        res.status(200).send('All valid records uploaded and inserted successfully!');
      } catch (error) {
        console.error('Error inserting records:', error);
        res.status(500).send('Error inserting records into the database.');
      }

      // Cleanup: Delete the uploaded file after processing
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        }
      });
    })
    .on('error', (error) => {
      console.error('Error parsing CSV:', error);
      res.status(500).send('Error processing the CSV file.');
    });
});


export default router;