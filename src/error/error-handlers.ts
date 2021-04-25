import { Response } from "got";
import { Message } from "aws-sdk/clients/sqs";
import { SQSHandler } from "../api-handlers/sqs-handler";


/**
 * A simple function to handle errors coming from any of the API or web handler classes.  Since they're always either HTTP\
 * errors from `got` or standard errors, the handling is the same.  This is just a code cleanliness thing to keep it DRY.
 *
 * Logs details about the error for help debugging.
 *
 * @param errorSource For external APIs, the name of the API that threw an error.
 * @param error The error being logged.
 */
export function handleApiError(errorSource: string, error: Error) {
    if (error["response"]) {
        const { statusCode, errorMessage } = parseHttpError(errorSource, error["response"]);
        console.error(`HTTP Error`);
        console.error(`Status Code: ${statusCode}`);
        console.error(`Error Message: ${errorMessage}`);
    } else {
        console.error(error.name);
        console.error(error.message);
    }
}

/**
 * A method of parsing more specific errors from API failures.  Allows us to read more specific logs from HTTP errors in
 * most cases, as both AccuWeather and BigPanda provide JSONs describing the error.
 *
 * @param errorSource The API that initially caused the error.
 * @param response The response received from the API. If we get a response, it's usually a JSON that has better error messaging.
 */
export function parseHttpError(errorSource: string, response: Response) {
    let errorMessage: string = `${errorSource} Error (${response.statusCode}): `;
    let detailedMessage: string;
    switch(errorSource) {
        case "AccuWeather API":
            detailedMessage = response.body["Message"];
            break;
        case "BigPanda API":
            detailedMessage = response.body["response"]["status"];
            break;
    }

    if(detailedMessage && detailedMessage.trim() !== "") {
        errorMessage += detailedMessage;
    } else if(typeof response.body === "string") {
        errorMessage = response.body;
    } else {
        errorMessage += response.statusMessage;
    }

    return {statusCode: response.statusCode, errorMessage: errorMessage}
}

/**
 * The SQS consumer that I'm using will delete a failed message if the error is caught, but if I remove
 * the catch, then the `got` library will cause the whole application to stop on an HTTP error, instead
 * of throwing the error in the consumer and allowing AWS to automatically requeue. This block of code
 * reads the number of retries remaining off the MessageAttributes and queues to the queue or Dead-Letter,
 * depending on whether or not any retries remain.
 *
 * @param errorSource The API that initially caused the error.  Used for the error logging method.
 * @param message The message that failed to process.  Used for reading retries and requeuing.
 * @param error The error being logged.
 */
export function handleSQSError(errorSource: string, message: Message, error: Error) {
    const sqsHandler: SQSHandler = new SQSHandler(process.env.AWS_SQS_URL);
    const deadLetterHandler: SQSHandler = new SQSHandler(process.env.AWS_DLQ_URL);

    handleApiError("BigPanda API", error);
    let remainingRetries: number;
    try {
        remainingRetries= parseInt(message.MessageAttributes["Retries"]["StringValue"]);
    } catch(err) {
        console.log("No Retries Provided.  Moving to Dead Letter Queue.");
        remainingRetries = 0;
    }

    let errorHandler: SQSHandler;
    if(!remainingRetries || remainingRetries <= 0) {
        errorHandler = deadLetterHandler;
    } else {
        remainingRetries -= 1;
        errorHandler = sqsHandler;
    }

    errorHandler.sendMessage(remainingRetries, message.Body)
        .then(({ MessageId}) => console.log(`Message Successfully Queued! SQS Message ID: ${MessageId}`))
        .catch((error) => handleApiError("SQS", error));
}
