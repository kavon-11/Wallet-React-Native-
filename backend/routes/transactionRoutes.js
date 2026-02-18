import express from "express";
import {
    createTransaction,
    getTransactionsByUserId,
    deleteTransaction,
    getSummaryByUserId
} from "../controllers/transactionController.js";

const router = express.Router();

// POST /api/transactions
router.post("/", createTransaction);

// GET /api/transactions/:user_id
router.get("/:user_id", getTransactionsByUserId);

// DELETE /api/transactions/:id
router.delete("/:id", deleteTransaction);

// GET /api/transactions/summary/:user_id
router.get("/summary/:user_id", getSummaryByUserId);

export default router;