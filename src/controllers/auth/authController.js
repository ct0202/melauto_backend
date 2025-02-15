const { User } = require('../../models/UserSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const handleLogin = async (req, res) => {
    const { email, pwd } = req.body;
    if (!email || !pwd) return res.status(400).json({ 'message': 'Username and password are required.' });

    const foundUser = await User.findOne({ email: email }).exec();
    if (!foundUser) return res.sendStatus(401); //Unauthorized 
    // evaluate password 
    const match = await bcrypt.compare(pwd, foundUser.password);
    if (match) {
        // create JWTs
        const accessToken = jwt.sign(
            {
                "email": foundUser.email,
                "fullname": foundUser.name,
                "role": foundUser.role
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '10m' }
        );
        const refreshToken = jwt.sign(
            { 
                "email": foundUser.email, 
                "fullname": foundUser.name,
                "role": foundUser.role
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '10d' }
        );
        // Saving refreshToken with current user
        foundUser.refreshToken = refreshToken;
        await foundUser.save();

        // Creates Secure Cookie with refresh token
        res.cookie('jwt', refreshToken, { httpOnly: true, secure: true, sameSite: true, maxAge: 24 * 60 * 60 * 1000 });
        // Send authorization roles and access token to user
        res.json({accessToken });

    } else {
        res.sendStatus(401);
    }
}

module.exports = { handleLogin };