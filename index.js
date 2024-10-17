import express from "express";
import routes from "./routes/movies.js";
import cors from "cors";

const app = express();
const PORT = 5001;

app.use(cors({
   origin: "http://localhost:3000",
   methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
   allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // If you are handling form data

app.use("/movies", routes); // Ensure this matches your Axios request

app.listen(PORT, () => console.log("Server is running on port", PORT));
