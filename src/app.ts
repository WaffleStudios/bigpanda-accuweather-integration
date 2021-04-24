/**
 * Initialize the 'dotenv' NPM library.  This library allows me to use a project-specific .env file to store environment
 * variables to be accessed using process.env.VARIABLE.  This file is where I have chosen to store things like API keys
 * and bearer tokens, and other things that pose a security risk when stored in plaintext.  Using a .env file to store
 * these things is easily, and by default, filtered out using .gitignore, and allows an easy and concise way to share
 * important login or API information within a group of people, if need be, and without requiring a complicated setup.
 */

require("dotenv").config();

import { Message } from "aws-sdk/clients/sqs";

import { AccuWeatherAPI } from "./apis/accuweather";
import { BigPandaAPI } from "./apis/bigpanda";
import { SQSHandler } from "./apis/sqs-handler";

/**
 * Initializing the locations as a map is a very easy way for me to do the exercise, while providing me the flexibility to
 * add later.  Thinking about this in terms of connecting a customer API, this would probably exist as something like a Lambda
 * or a lightweight microservice.  Additionally, it would probably be something that would run on a job and not get much use
 * out of direct user input.  Something that could be done to improve this as a product would be using environmental variables,
 * provide a list of location IDs that you'd like to run through.  This would save a loop through the keys, as well as allow
 * for list updates without a deployment (in the case of a Lambda), but would lose visibility on what the keys correspond to,
 * which could prove tedious if trying to remove a whole city, for example.
 *
 * Something cool and extra I briefly considered doing was to provide a list of city names and use the API to fetch the
 * location codes just with that, but this would very quickly exhaust available uses of the AccuWeather API, both as an
 * exercise and in a practical use of it, so for simplicity's sake, I'm just using the list provided in the exercise document.
 */
const locations: Map<string, string[]> = new Map<string, string[]>();

locations.set("San Francisco", ["347629", "113032", "261737", "3409211", "262723"]);
locations.set("New York", ["349727", "710949", "2531279", "2245721", "2212053"]);
locations.set("Chicago", ["348308", "2249562", "1162619", "1169367", "1068089"]);


/**
 * Using classes to manage the APIs allows us an easy way to store and apply API-specific configurations, reuse the
 * same APIs for different customers with minimal reconfiguration, and clearly define and document what an API call
 * is doing, what we use it for, and what values are required to use that API or method.
 */
const accuWeatherAPI: AccuWeatherAPI = new AccuWeatherAPI(process.env.ACCUWEATHER_API_KEY);
const bigPandaAPI: BigPandaAPI = new BigPandaAPI(process.env.BIGPANDA_BEARER_TOKEN);

try {
    const sqsHandler: SQSHandler = new SQSHandler(process.env.AWS_SQS_URL);

    sqsHandler.startConsumer((message: Message) => {
        bigPandaAPI.sendAlert(process.env.BIGPANDA_API_KEY, JSON.parse(message.Body))
            .then(() => sqsHandler.deleteMessage(message.ReceiptHandle))
            .then(() => console.log("BigPanda Alert Successfully Processed!"))
            .catch((error) => handleApiError(error));
    });

    /**
     * SQS offers configurations to retry messages a number of times between 1-100.  After the specified number of retries,
     * SQS will automatically move the message into a configurable dead-letter queue.
     *
     * Uncomment this block of code to start a Dead-Letter queue listener.
     */
    // const deadLetterHandler: SQSHandler = new SQSHandler(process.env.AWS_DLQ_URL);
    // deadLetterHandler.startConsumer((message: Message) => {
    //     bigPandaAPI.sendAlert(process.env.BIGPANDA_API_KEY, JSON.parse(message.Body))
    //         .then(() => sqsHandler.deleteMessage(message.ReceiptHandle))
    //         .then(() => console.log("BigPanda Alert Successfully Processed!"))
    //         .catch((error) => handleApiError(error));
    // });


    locations.forEach((locationIDs: string[], location: string) => {
        locationIDs.forEach((locationID: string) => {
            accuWeatherAPI.fetchCurrentConditions(locationID)
                .then(({ body }) => accuWeatherAPI.formatConditionsAsBigPandaAlert(location, locationID, body[0]))
                .then((alertJSON: object) => sqsHandler.sendMessage(JSON.stringify(alertJSON)))
                .then(({ MessageId}) => console.log(`Message Successfully Queued! SQS Message ID: ${MessageId}`))
                .catch((error) => handleApiError(error));
        });
    });
} catch(err) {
    console.error(err);
}

/**
 * This is just a simple class to handle errors coming from any of the API or web handler classes.  Since they're always
 * either HTTP errors from `got` or standard errors, the handling is the same.  This is just a code cleanliness thing to
 * keep it dry.  This just logs details about the error for help debugging.
 * @param error
 */
function handleApiError(error: Error) {
    if (error["response"]) {
        console.error(`HTTP Error`);
        console.error(`Status Code: ${error["response"].statusCode}`);
        console.error(`Error Message: ${error["response"].statusMessage}`);
    } else {
        console.error(error.name);
        console.error(error.message);
    }
}
