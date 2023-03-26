var jwt = require('jsonwebtoken');
const JWT_SECRET = 'KingKohli';
const path = require('path');

const fetchuser = (req, res, next) => {
    // Get the user from the jwt token and add id to req object
    const token = req.header('auth-token');
    if (!token) {
        res.redirect("/slogin");
    }
    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data.user;
        next();
    } catch (error) {
        res.redirect("/slogin");
        // res.sendFile(path.join(__dirname + '/demo3.html'));
        // res.status(401).send({ error: "Please authenticate using a valid token" })
    }

}


module.exports = fetchuser;