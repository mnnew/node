const express = require("express");
const axios = require("axios");
const redis = require("redis");
const pincodeData = require('./pincode.json')
const currancy_code = require('./currancy.json')
const dial_code = require('./contryname_and_code.json')
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded());
app.use(express.json());

let redisClient;

(async () => {
    redisClient = redis.createClient();

    redisClient.on("error", (error) => console.error(`Error : ${error}`));

    await redisClient.connect();
})();

async function fetchApiData(species) {
    const apiResponse = await axios.get(
        `https://www.fishwatch.gov/api/species/${species}`
    );
    console.log("Request sent to the API");
    return apiResponse.data;
}

async function getSpeciesData(req, res) {
    const species = req.params.species;
    let results;
    let isCached = false;

    try {
        const cacheResults = await redisClient.get(species);
        if (cacheResults) {
            isCached = true;
            results = JSON.parse(cacheResults);
        } else {
            results = await fetchApiData(species);
            if (results.length === 0) {
                throw "API returned an empty array";
            }
            await redisClient.set(species, JSON.stringify(results));
        }

        res.send({
            fromCache: isCached,
            data: results,
        });
    } catch (error) {
        console.error(error);
        res.status(404).send("Data unavailable");
    }
}

app.get("/fish/:species", getSpeciesData);


app.post('/fish/name', async (req, res) => {

    let name = req.body.new

    console.log(name);

    await redisClient.rPush(['name', JSON.stringify('ReactJS', 'Angular')], function (err, reply) {
        console.log(reply); // OK
    });

    res.json({
        message: 'Success'
    })

});


app.get('/fish/get/name', async (req, res) => {

    let name = await redisClient.get('framework')

    res.json({
        message: name
    })
});


app.get('/', async (req, res) => {

  res.status(200).send("Deploy Api Running")
});


app.post('/pincode/data', async (req, res) => {

    try {

        const { stateName, districtName, officeName } = req.body

        const pincode = await pincodeData

        if (!stateName || !districtName || !officeName) {

            res.status(200).json({ data: pincode })

        } else {

            const stateName_data = await pincode.filter(item => item.stateName == stateName)

            const districtName_data = await stateName_data.filter(item => item.districtName == districtName)

            const officeName_data = await districtName_data.filter(item => item.officeName == officeName)

            const officeName_pincode = officeName_data[0].pincode

            const apiResponse = await axios.get(
                `https://api.postalpincode.in/pincode/${officeName_pincode}`
            );
            console.log("Request sent to the API");

            // return apiResponse.data;

            res.status(200).json({ data: apiResponse.data })
        }

    } catch (error) {
        res.status(400).json({ data: "Data Not Found !" })
    }

});


app.post('/currancycode/data', async (req, res) => {

    try {

        const { countryName } = req.body

        const currancycode = await currancy_code

        if ( !countryName ) {

            res.status(200).json({ data: currancycode })

        } else {

            const stateName_data = await currancycode.filter(item => item.countryName == countryName)

            const officeName_pincode = stateName_data

            res.status(200).json({ data: officeName_pincode })
        }

    } catch (error) {
        res.status(400).json({ data: "Data Not Found !" })
    }

});


app.post('/dialcode/data', async (req, res) => {

    try {

        const { name } = req.body

        const dialcode = await dial_code

        if ( !name ) {

            res.status(200).json({ data: dialcode })

        } else {

            const dialcode_data = await dialcode.filter(item => item.name == name)

            const Contry_dialcode = dialcode_data

            res.status(200).json({ data: Contry_dialcode })
        }

    } catch (error) {
        res.status(400).json({ data: "Data Not Found !" })
    }

});


app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});