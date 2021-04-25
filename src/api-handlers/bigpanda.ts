import got from "got";

export class BigPandaAPI {
    private bearerToken: string;

    static apiUrl: string = "https://api.bigpanda.io";

    /**
     * Creates a class for managing the BigPanda API.  This includes management and light verification of API credentials,
     * as well as methods to perform any required outbound API calls.
     *
     * @constructs BigPandaAPI
     * @throws BigPandaError
     *
     * @param bearerToken The Bearer Token for the BigPanda account being integrated with.  Throws an error if the token is empty or undefined.
     */
    constructor(bearerToken: string) {
        if(!bearerToken || bearerToken.trim() === "") {
            throw new BigPandaError("Error: A Bearer Token is required to use the BigPanda service.");
        }

        this.bearerToken = bearerToken;
    }

    /**
     * Uses the BigPanda API to retrieve current weather conditions for the provided location.
     *
     * @throws BigPandaError
     *
     * @param appKey The App Key for the integration that the user is trying to alert.  Throws an error if the key is empty or undefined.
     * @param alert The JSON for the alert being sent to BigPanda.  Should be a single entry.  Fails if it doesn't exist,
     *          is an array, or doesn't contain the required "host" or "status" fields.
     */
    sendAlert(appKey: string, alert: object) {
        if(!appKey || appKey.trim() === "") {
            throw new BigPandaError("Error: An App Key is required to use the BigPanda service.");
        }

        if (!alert) {
            throw new BigPandaError("Error: Please provide an alert JSON.");
        } else if(alert instanceof Array) {
            throw new BigPandaError("Error: Alert JSON cannot be an Array.");
        }

        const requiredFields: string[] = ["host", "status"];
        requiredFields.forEach((requiredField: string) => {
            if(!alert[requiredField] || alert[requiredField].trim() === "") {
                throw new BigPandaError(`Error: Alert JSON missing required field: "${requiredField}".`);
            }
        });

        alert["app_key"] = appKey;

        return got(`${BigPandaAPI.apiUrl}/data/v2/alerts`, {
            method: "POST",
            headers: {"Authorization": `Bearer ${this.bearerToken}`},
            json: alert,
            responseType: "json"
        });
    }
}

export class BigPandaError extends Error {

    /**
     * A custom error class for identifying configuration problems using the BigPandaAPI class.
     *
     * @constructs BigPandaError
     *
     * @param errorMessage A brief message indicating what went wrong.
     */
    constructor(errorMessage: string) {
        super(errorMessage);

        // This is a workaround to make TypeScript and Chai play nice with custom errors.  I don't usually like writing
        // code that serves no purpose other than making tests run correctly.  In this case, though, I wrote custom errors,
        // I want to make sure I'm getting custom errors.
        Object.setPrototypeOf(this, BigPandaError.prototype);
        this.name = "BigPanda API Error";
    }
}
