const verifyStaticHeader = (req, res, next) => {
    const receivedHeader = req.headers["vvcmc"]; 
    if (!receivedHeader || receivedHeader !== "saavi@infinet") {
        return res.status(403).json({ message: "Unauthorized: Invalid or Missing Header" });
    }
    next();
};
module.exports = verifyStaticHeader;
