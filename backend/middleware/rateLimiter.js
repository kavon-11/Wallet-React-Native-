import rateLimiter from "../config/upstash.js";

const rateLimitMiddleware = async (req, res, next) => {
    try {
        // const ip = req.ip;
        const { success } = await rateLimiter.limit("my-rate-limit");

        if (!success) {
            return res
                .status(429)
                .json({ error: "Too many requests, please try again later." });
        }

        next();
    } catch (error) {
        next(error);
    }
 
}

export default rateLimitMiddleware;