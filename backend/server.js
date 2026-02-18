import express from "express";
import dotenv from "dotenv";
import { sql } from "./config/db.js";
import rateLimitMiddleware from "./middleware/rateLimter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(rateLimitMiddleware);

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

app.post("/api/transactions", async (req, res) => {
    try {
        const { user_id, title, amount, category } = req.body;
        if (!user_id || !title || !amount || category === undefined) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const result = await sql`INSERT INTO transactions (user_id, title, amount, category)
            VALUES (${user_id}, ${title}, ${amount}, ${category}) 
            RETURNING *`;
        res.status(201).json(result[0]);
    } catch (error) {
        console.error("Error creating transaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/transactions/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;
        if (!user_id) {
            return res.status(400).json({ error: "Missing user_id parameter" });
        }
        const transactions = await sql`SELECT * FROM transactions WHERE user_id = ${user_id}
            ORDER BY created_at DESC`;
        res.status(200).json(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.delete("/api/transactions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Missing id parameter" });
        }
        const result = await sql`DELETE FROM transactions WHERE id = ${id} RETURNING *`;
        if (result.length === 0) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        res.status(200).json({ message: "Transaction deleted successfully", deletedTransaction: result[0] });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/transactions/summary/:user_id", getSummaryByUserId);

async function getSummaryByUserId(req, res) {
    try {
        const { user_id } = req.params;

        const balanceResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as balance FROM transactions WHERE user_id = ${user_id}
    `;

        const incomeResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as income FROM transactions
      WHERE user_id = ${user_id} AND amount > 0
    `;

        const expensesResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as expenses FROM transactions
      WHERE user_id = ${user_id} AND amount < 0
    `;

        res.status(200).json({
            balance: balanceResult[0].balance,
            income: incomeResult[0].income,
            expenses: expensesResult[0].expenses,
        });
    } catch (error) {
        console.log("Error getting the summary", error);
        res.status(500).json({ message: "Internal server error" });
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

