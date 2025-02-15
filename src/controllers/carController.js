const crypto = require("crypto");

const University = require('../models/CarSchema');

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

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


const deleteImages = async (imageNames) => {
    console.log(`Deleting ${imageNames.length} images...`);

    let results = [];

    for (const imageName of imageNames) {
        const deleteParams = {
            Bucket: bucket_name,
            Key: imageName,
        };

        try {
            const result = await s3.send(new DeleteObjectCommand(deleteParams));
            results.push({ imageName, success: true, result });
            console.log(`Deleted: ${imageName}`);
        } catch (error) {
            results.push({ imageName, success: false, error });
            console.error(`Error deleting ${imageName}:`, error);
        }
    }

    return results;
};



const createUniversity = async (req, res) => {
    try {
        const university = new University(req.body);
        let imageNames = [];

        for (const file of req.files) {
            console.log('processing file: ', file.originalname, '...');

            const ImageName = randomImageName()
            const params = {
                Bucket: bucket_name,
                Key: ImageName,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            const command = new PutObjectCommand(params);

            await s3.send(command);
            imageNames.push(ImageName);
        }
        university.images = imageNames;

        await university.save();
        res.status(201).json(university);
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }

    //
    // const params = {
    //     Bucket: bucket_name,
    //     Key: req.files[0].originalname,
    //     Body: req.files[0].buffer,
    //     ContentType: req.files[0].mimetype,
    // }
    //
    // const command = new PutObjectCommand(params);
    //
    // await s3.send(command);

};

const getAllUniversities = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;

        const limit = parseInt(req.query.limit) || 10;

        const status_tag = req.query.statusFilter || null;

        const search = req.query.search || '';

        // Create a filter object based on status_tag if provided
        const filter = {};
        if (status_tag && status_tag !== 'Все') {
            filter.status_tag = status_tag;
        }
        if (search) {
            filter.name = { $regex: search, $options: 'i' }; // Case-insensitive search by name
        }
        else {
            console.log('not searching');
        }
        const skip = (page - 1) * limit;

        let universities = await University.find(filter)
            .skip(skip)
            .limit(limit);

        universities = universities.map(university => ({
            ...university.toObject(),
            imageUrls: []
        }));

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

        const totalUniversities = await University.countDocuments(filter);

        res.json({
            universities,
            totalPages: Math.ceil(totalUniversities / limit),
            currentPage: page,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getUniversityById = async (req, res) => {
    try {
        const university = await University.findById(req.params.id);
        if (!university) return res.status(404).json({ message: 'University not found' });
        res.json(university);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUniversity = async (req, res) => {
    try {
        console.log('REQUEST => ', req.body);

        const carId = req.params.id;
        const defaultParamsUpdate = await University.findByIdAndUpdate(carId, req.body);
        console.log('defaultParamsUpdate: \n', defaultParamsUpdate, '\n ===================');

        const newCarData = new University(req.body);
        console.log('newCarData => ', newCarData);




        const carData = await University.findById(carId);



        if (!carData) {
            return res.status(404).json({ message: "Document not found" });
        }

        const deleteImagesNames = JSON.parse(req.body.delete_images);
        carData.images = carData.images.filter(img => !deleteImagesNames.includes(img));
        console.log(carData.images);




        const deletionResults = await deleteImages(deleteImagesNames);
        console.log('deletionResults', deletionResults);

        let imageNames = [];

        console.log('multer data + : ', req.files);

        for (const file of req.files) {
            console.log('processing file: ', file.originalname, '...');

            const ImageName = randomImageName()
            const params = {
                Bucket: bucket_name,
                Key: ImageName,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            const command = new PutObjectCommand(params);

            await s3.send(command);
            imageNames.push(ImageName);
        }
        console.log('----exit from files loop----');

        try {
            carData.images.push(...imageNames);
        }
        catch(e){
            console.error('error adding new image names -> ', e)
        }
        console.log(imageNames);

        await carData.save();

        // const university = await University.findByIdAndUpdate(req.params.id, req.body);
        // if (!university) return res.status(404).json({ message: 'University not found' });
        res.status(201).json(carData);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteUniversity = async (req, res) => {
    try {
        const car = await University.findById(req.params.id);
        const carImagesNames = car.images;
        const deletionResults = await deleteImages(carImagesNames);
        console.log('deletionResults', deletionResults);

        const university = await University.findByIdAndDelete(req.params.id);

        if (!university) return res.status(404).json({ message: 'University not found' });
        res.json({ message: 'University deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createUniversity,
    getAllUniversities,
    getUniversityById,
    updateUniversity,
    deleteUniversity
};
