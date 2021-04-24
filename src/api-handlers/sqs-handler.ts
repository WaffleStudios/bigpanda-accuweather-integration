import * as SQS from "aws-sdk/clients/sqs";

require('dotenv').config();

const AWS = require("aws-sdk");
const { Consumer } = require("sqs-consumer");
import {
    Message,
    SendMessageRequest,
} from "aws-sdk/clients/sqs";

export class SQSHandler {
    private url: string;
    private sqs: SQS;

    /**
     * Creates a class for managing the message queue using AWS SQS using a queue URL.  Something that I think would be good
     * to add to this would be to add a static method to create a new Queue, as well as the ability to use queue names and
     * servers instead of providing a URL, but for this exercise, I just need the URL.
     *
     * Unlike the API constructions, there's no way to specify, in code, new credentials, so those live in the .env file
     * where the rest of the process.env variables are stored.  I think that in a role like the Solutions Engineer, AWS
     * credentials will, generally, be used like this anyway.
     *
     * @constructs SQSHandler
     * @throws SQSHandler
     *
     * @param url The URL where the desired SQS queue is loaded.  Cannot be null or empty, and must be a valid SQS url structure.
     */
    constructor(url: string) {
        if(!url || !url.match(/^https:\/\/sqs.(?:us|af|ap|ca|eu|me|sa)-(?:central|east|west|south)-[1-3].amazonaws.com\/\d+\/\S+$/g)) {
            throw new SQSHandlerError("Please provide a valid SQS URL to use the SQS Handler.");
        }

        AWS.config.update({region: "us-east-2"});
        this.sqs = new AWS.SQS();

        this.url = url;
    }

    /**
     * Adds a provided message to the SQS queue.  For the purposes of the exercise, this will be a JSON string of the BigPanda
     * alert message, but this method could be used to send any message.
     * @param message A non-empty string to apply as the message body for the SQS message.
     */
    sendMessage(message: string) {
        if(!message || message.trim() === "") {
            throw new SQSHandlerError("Please provide a valid message to send to SQS.");
        }

        const params: SendMessageRequest = {
            DelaySeconds: 10,
            MessageBody: message,
            QueueUrl: this.url
        };

        return this.sqs.sendMessage(params).promise();
    }

    /**
     * Initializes a consumer for the SQS queue URL provided in the construction of the Handler.
     * @param messageHandler A callback method which process a message from the SQS queue.
     */
    startConsumer(messageHandler: (message: Message) => void) {
        const app = Consumer.create({
            queueUrl: this.url,
            handleMessage: messageHandler,
            sqs: this.sqs
        });

        app.on('error', (error) => {
            console.error(error.name);
            console.error(error.message);
        });

        app.on('processing_error', (error) => {
            console.error(error.name);
            console.error(error.message);
        });

        app.on('timeout_error', (error) => {
            console.error(error.name);
            console.error(error.message);
        });

        app.on('stopped', () => {
            console.log("Queue Polling stopped!!");
        });

        app.start();
    }
}

export class SQSHandlerError extends Error {

    /**
     * A custom error class for identifying configuration problems using the SQSHandler class.
     *
     * @constructs SQSHandlerError
     *
     * @param errorMessage A brief message indicating what went wrong.
     */
    constructor(errorMessage: string) {
        super(errorMessage);

        // This is a workaround to make TypeScript and Chai play nice with custom errors.  I don't usually like writing
        // code that serves no purpose other than making tests run correctly.  In this case, though, I wrote custom errors,
        // I want to make sure I'm getting custom errors.
        Object.setPrototypeOf(this, SQSHandlerError.prototype);
        this.name = "SQS Handler Error";
    }
}