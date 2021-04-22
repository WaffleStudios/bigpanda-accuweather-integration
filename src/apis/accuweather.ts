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
        if(!apiKey || apiKey.trim() === "") {
            throw new AccuWeatherError("Error: An API key is required to use the AccuWeather service.");
        }

        this.apiKey = apiKey;
    }

    /**
     * Uses the AccuWeather API to retrieve current weather conditions for the provided location.
     *
     * @throws AccuWeatherError
     *
     * @param locationID The AccuWeather location ID.  Throws an error if the key is empty or undefined.
     */
    fetchCurrentConditions(locationID: string) {
        if (!locationID || locationID.trim() === "") {
            throw new AccuWeatherError("Error: Please provide a location ID to fetch weather conditions.");
        }

        return got(`${AccuWeatherAPI.apiUrl}/currentconditions/v1/${locationID}`, {
            searchParams: {apikey: this.apiKey},
            method: "GET",
            responseType: "json"
        });
    }

    /**
     * Takes a current conditions JSON response and assigns the relevant values to a format used by the BigPanda alert API.
     * @param location The city name.  Used as the "host" to condense weather events by city.  Cannot be empty.
     * @param locationID The location ID.  Used as the incident identifier to clarify different weather events in different
     *          parts of a city.  Cannot be empty.
     * @param conditionsJSON The response received from the current conditions endpoint.  Technically, we receive an array
     *          but I've only seen it come through as an array with a size of 1, so just provide response[0] for now.
     */
    formatConditionsAsBigPandaAlert(location: string, locationID: string, conditionsJSON: object) {
        return new Promise((resolve) => {
            if(!location || location.trim() === "") {
                throw new AccuWeatherError("Error: Please provide a location name to format the BigPanda alert.");
            } else if(!locationID || locationID.trim() === "") {
                throw new AccuWeatherError("Error: Please provide a location ID to format the BigPanda alert.");
            } else if(!conditionsJSON || conditionsJSON === {}) {
                throw new AccuWeatherError("Error: Please provide a valid response from the Current Conditions endpoint.");
            }

            let alertJSON: object = {
                host: location,
                status: "warning",
                check: 'Weather Check',
                incident_identifier: locationID,
                condition: conditionsJSON["WeatherText"],
                precipitation: conditionsJSON["HasPrecipitation"],
                precipitation_type: conditionsJSON["PrecipitationType"],
                link: conditionsJSON["Link"]
            };

            resolve(alertJSON);
        });
    }
}

export class AccuWeatherError extends Error {

    /**
     * A custom error class for identifying configuration problems using the AccuWeatherAPI class.
     *
     * @constructs AccuWeatherError
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
