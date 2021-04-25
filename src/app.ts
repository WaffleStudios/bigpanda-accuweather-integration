/**
 * Initialize the 'dotenv' NPM library.  This library allows me to use a project-specific .env file to store environment
 * variables to be accessed using process.env.VARIABLE.  This file is where I have chosen to store things like API keys
 * and bearer tokens, and other things that pose a security risk when stored in plaintext.  Using a .env file to store
 * these things is easily, and by default, filtered out using .gitignore, and allows an easy and concise way to share
 * important login or API information within a group of people, if need be, and without requiring a complicated setup.
 */
require("dotenv").config();

const express = require("express");
const prompt = require("prompt-sync")();
import got, { HTTPError } from "got";
import { Message } from "aws-sdk/clients/sqs";

import { AccuWeatherAPI } from "./api-handlers/accuweather";
import { BigPandaAPI } from "./api-handlers/bigpanda";
import { SQSHandler } from "./api-handlers/sqs-handler";
import { handleApiError, parseHttpError, handleSQSError } from "./error/error-handlers";

try {
    /**
     * Using classes to manage the APIs allows us an easy way to store and apply API-specific configurations, reuse the
     * same APIs for different customers with minimal reconfiguration, and clearly define and document what an API call
     * is doing, what we use it for, and what values are required to use that API or method.
     */
    const accuWeatherAPI: AccuWeatherAPI = new AccuWeatherAPI(process.env.ACCUWEATHER_API_KEY);
    const bigPandaAPI: BigPandaAPI = new BigPandaAPI(process.env.BIGPANDA_BEARER_TOKEN);
    const sqsHandler: SQSHandler = new SQSHandler(process.env.AWS_SQS_URL);
    const deadLetterHandler: SQSHandler = new SQSHandler(process.env.AWS_DLQ_URL);

    /**
     * Initialize a simple Express server to listen for API calls to fetch new weather events.  To use this, send an
     * POST call to http://localhost:3000/alert with a json formatted: {"locationName": "Austin", "locationID": "351193"}.
     *
     * This was built to demonstrate the flexibility and reusability of the API handlers that I wrote, as well as
     * highlight a potential use-case beyond the static examples provided in the exercise document.
     */
    const app = express();
    const port = process.env.PORT || 3000;

    app.use(express.json());
    app.post("/alert", (req, res) => {
        const { locationName, locationID } = req.body;
        if(!locationName || locationName.trim() === "") {
            res.status(400).send("Please provide a valid location name.")
        } else if(!locationID || locationID.trim() === "") {
            res.status(400).send("Please provide a valid location ID,")
        }

        accuWeatherAPI.fetchCurrentConditions(locationID)
            .then(({ body }) => accuWeatherAPI.formatConditionsAsBigPandaAlert(locationName, locationID, body[0]))
            .then((alertJSON: object) => sqsHandler.sendMessage(5, JSON.stringify(alertJSON)))
            .then(({ MessageId}) => res.send(`Message Successfully Queued! SQS Message ID: ${MessageId}`))
            .catch((error) => {
                if(error instanceof HTTPError) {
                    const { response } = error;
                    const { statusCode, errorMessage} = parseHttpError("AccuWeather API", response);

                    res.status(statusCode).send(errorMessage);
                } else {
                    res.status(500).send(error.message);
                }
            });
    });

    app.listen(port);

    console.log("Listening for Location JSON on Port: " + port);

    /**
     * Starts the SQS consumer. This will poll every few seconds to receive any incoming SQS messages to the provided queue.
     *
     * Normally, in a live app using SQS, I would use a Lambda to do this. This is because you are able to tie a Lambda
     * in with the queue so that the Lambda is able to process the message upon receipt. For the purposes of this
     * exercise or a case where, for some reason, a Lambda could not be used, you can run this as a standalone service
     * to listen and process messages in a provided SQS queue.
     */
    sqsHandler.startConsumer((message: Message) => {
        bigPandaAPI.sendAlert(process.env.BIGPANDA_API_KEY, JSON.parse(message.Body))
            .then(() => console.log("BigPanda Alert Successfully Processed!"))
            .catch((error) => handleSQSError("BigPanda API", message, error));
    });

    console.log("Listening for Messages from SQS");

    /**
     * SQS offers configurations to retry messages a number of times between 1-100.  After the specified number of retries,
     * SQS will automatically move the message into a configurable dead-letter queue.  The queue that I set up for this
     * exercise will dead-letter the message after five tries.
     *
     * This code will start the Dead-Letter Queue, with user prompt.
     */
    let runDeadLetter: string = prompt("Start Dead-Letter Queue Listener? (y/n): ");
    if(runDeadLetter.toLowerCase() === "y") {
        deadLetterHandler.startConsumer((message: Message) => {
            bigPandaAPI.sendAlert(process.env.BIGPANDA_API_KEY, JSON.parse(message.Body))
                .then(() => console.log("BigPanda Alert Successfully Processed!"))
                .catch((error) => handleSQSError("BigPanda API", message, error));
        });

        console.log("Listening for Messages from the Dead-Letter Queue");
    }

    /**
     * Automatically makes a call to the now running API to send alerts for the locations provided in the exercise.
     */
    const locations: Map<string, string[]> = new Map<string, string[]>();
    locations.set("San Francisco", ["347629", "113032", "261737", "3409211", "262723"]);
    locations.set("New York", ["349727", "710949", "2531279", "2245721", "2212053"]);
    locations.set("Chicago", ["348308", "2249562", "1162619", "1169367", "1068089"]);

    console.log("Sending exercise test data.");

    locations.forEach((locationIDs: string[], location: string) => {
        locationIDs.forEach((locationID: string) => {
            got("http://localhost:3000/alert", {
                json: {locationName: location, locationID: locationID},
                method: "POST"
            }).then(({body}) => console.log(body)).catch((error) => handleApiError("AccuWeather API", error));
        });
    });
} catch(err) {
    console.error(err);
}
