import * as SQS from "aws-sdk/clients/sqs";

require('dotenv').config();

const AWS = require("aws-sdk");
const https = require("https");
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
        this.sqs = new AWS.SQS({
            httpOptions: {
                agent: new https.Agent({
                    keepAlive: true
                })
            }
        });

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
     * Initializes a consumer for the SQS queue URL provided in the construction of the Handler.  Normally, in a live app
     * using SQS, I would use a Lambda to do this. This is because you are able to tie a Lambda in with the SQS so that the
     * Lambda is able to process the queued message upon receipt. For the purposes of this exercise or a case where, for some
     * reason, a Lambda could not be used, you can run this as a standalone service to listen and process messages in a
     * provided SQS queue.
     * @param messageHandler A callback method which process a message from the SQS queue.
     */
    startConsumer(messageHandler: (message: Message) => void) {
        const app = Consumer.create({
            queueUrl: this.url,
            handleMessage: messageHandler,
            sqs: this.sqs
        });

        app.on('error', (err) => {
            throw new SQSHandlerError(err.message);
        });

        app.on('processing_error', (err) => {
            throw new SQSHandlerError(err.message);
        });

        app.on('timeout_error', (err) => {
            throw new SQSHandlerError(err.message);
        });

        app.on('empty', () => {
            console.log("Queue Empty!");
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
