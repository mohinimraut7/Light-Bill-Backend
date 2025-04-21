const verifyStaticHeader = (req, res, next) => {
    const receivedHeader = req.headers["vvcmcsaaviinfinet"]; 
   
        if (!receivedHeader || receivedHeader !== "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YTZmYmI3NjZkMWYxNWY1OGM0NTNhYiIsInJvbGUiOiJTdXBlciBBZG1pbiIsImlhdCI6MTczODk5ODIyMywiZXhwIjoxNzQxNTkwMjIzfQ.YQRt7Kj4-eRejrs-G073tvzLdM_9oQDOYuQYmxSWsgs") {


        return res.status(403).json({ message: "Unauthorized: Invalid or Missing Header" });
    }
    next();
};
module.exports = verifyStaticHeader;


