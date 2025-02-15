const { User } = require('../../models/UserSchema');
const bcrypt = require('bcrypt');

const createNewUser = async (req, res) => {
    const { email, pwd, name, role } = req.body;
    if (!email || !pwd || !name || !role) return res.status(400).json({ 'message': 'Username, password, role and Name are required.' });

    // check for duplicate usernames in the db
    const duplicate = await User.findOne({ email: email }).exec();
    if (duplicate) return res.sendStatus(409); //Conflict 

    try {
        //encrypt the password
        const hashedPwd = await bcrypt.hash(pwd, 10);

        //create and store the new user
        const result = await User.create({
            "name": name,
            "email": email,
            "password": hashedPwd,
            "role": role
        });

        res.status(201).json({ 'success': `New user ${email} created!` });
    } catch (err) {
        res.status(500).json({ 'message': err.message });
    }
}

module.exports = { createNewUser };