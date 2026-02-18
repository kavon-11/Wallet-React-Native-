import express from "express";
import dotenv from "dotenv";
import { sql } from "./config/db.js";
import rateLimitMiddleware from "./middleware/rateLimiter.js";
import transactionRoutes from "./routes/transactionRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(rateLimitMiddleware);

// Routes
app.use("/api/transactions", transactionRoutes);

async function initDB() {
    try {
        await sql`CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            category VARCHAR(255) NOT NULL,
            created_at DATE NOT NULL DEFAULT CURRENT_DATE
        )`;
        console.log("Database initialized successfully");
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1);
    }
}



initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to initialize the database:", error);
    process.exit(1);
});

