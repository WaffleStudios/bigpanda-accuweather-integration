import got from "got";

export class AccuWeatherAPI {
    private apiKey: string;

    static apiUrl: string = "https://dataservice.accuweather.com";

    /**
     * Creates a class for managing the AccuWeather API.  This includes management and light verification of API credentials,
     * as well as methods to perform any required outbound API calls.  For the purposes of the exercise, only the `currentconditions`
     * endpoint is needed, but new methods would be very simple to add as need be.
     *
     * @constructs AccuWeatherAPI
     * @throws AccuWeatherError
     *
     * @param apiKey The API key provided by the AccuWeather service.  Throws an error if the key is empty or undefined.
     */
    constructor(apiKey: string) {
        if(!apiKey || apiKey.trim() === '') {
            throw new AccuWeatherError("Error: An API key is required to use the AccuWeather service.");
        }

        this.apiKey = apiKey;
    }

    /**
     * Uses the AccuWeather API to retrieve current weather conditions for the provided location.
     *
     * @throws AccuWeatherError
     *
     * @param locationId The AccuWeather location ID.  Throws an error if the key is empty or undefined.
     */
    fetchCurrentConditions(locationId: string) {
        if (!locationId || locationId.trim() === '') {
            throw new AccuWeatherError("Error: Please provide a location ID to fetch weather conditions.");
        }

        return got(`${AccuWeatherAPI.apiUrl}/currentconditions/v1/${locationId}`, {
            searchParams: {apikey: this.apiKey},
            method: "GET",
            responseType: 'json'
        });
    }
}

export class AccuWeatherError extends Error {

    /**
     * A custom error class for identifying configuration problems using the AccuWeatherAPI class.
     *
     * @constructs AccuWeatherAPI
     *
     * @param errorMessage A brief message indicating what went wrong.
     */
    constructor(errorMessage: string) {
        super(errorMessage);

        // This is a workaround to make TypeScript and Chai play nice with custom errors.  I don't usually like writing
        // code that serves no purpose other than making tests run correctly.  In this case, though, I wrote custom errors,
        // I want to make sure I'm getting custom errors.
        Object.setPrototypeOf(this, AccuWeatherError.prototype);
        this.name = "AccuWeather API Error";
    }
}
