const Car = require("../models/CarSchema");

const {getSignedUrl} = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand} = require("@aws-sdk/client-s3");

const bucket_name = process.env.BUCKET_NAME;
const bucket_region = process.env.BUCKET_REGION;
const bucket_access_key = process.env.BUCKET_ACCESS_KEY;
const bucket_secret = process.env.BUCKET_SECRET_ACCESS_KEY;

const s3 = new S3Client({
    credentials:{
        accessKeyId: bucket_access_key,
        secretAccessKey: bucket_secret,
    },
    region: bucket_region
})


const getAll = async (req, res) => {
    try {
        console.log('user catalog get');
        const filter = {};
        let universities = await Car.find(filter);

        universities = universities.map(university => ({
            ...university.toObject(),
            imageUrls: []
        }));

        console.log(universities);

        const carsImages = [];
        let carI = 0;


        for (const car of universities) {
            carsImages[car._id] = [];
            const imageNameList = car.images;

            for (const imageName of imageNameList) {

                const getObjectParams = {
                    Bucket: bucket_name,
                    Key: imageName,
                }

                try {
                    const command = new GetObjectCommand(getObjectParams);
                    const url = await getSignedUrl(s3, command, { expiresIn: 150 });
                    try {
                        carsImages[car._id].push({url, imageName});
                    }
                    catch (error) {
                        console.error("error collecting carsImages: ", error);
                    }
                } catch (error) {
                    console.error("Error getting signed URL:", error);
                    if (error.message) {
                        console.error("Error message:", error.message);
                    }
                    if (error.code) {
                        console.error("Error code:", error.code);
                    }
                    if (error.response) {
                        console.error("Error response:", error.response);
                    }
                }
            }

            universities[carI]['imageUrls'] = carsImages[car._id];
            carI++;
        }

        const totalUniversities = await Car.countDocuments(filter);

        console.log(universities);

        res.json({
            universities,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAll
};