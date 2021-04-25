import { AccuWeatherAPI, AccuWeatherError } from "../src/api-handlers/accuweather";

import { expect } from "chai";
const nock = require("nock");
const sinon = require("sinon");
const responses = require("./accuweather-responses");

const location_name: string = "location";
const locationId: string = "location_id";
const apiKey: string = "api_key";

const accuWeatherAPI: AccuWeatherAPI = new AccuWeatherAPI(apiKey);

/**
 * Unit tests exist to make sure that the code is running correctly and that anticipated errors can be handled and rerouted
 * correctly.  I'm using these tests to make sure that all of my problem cases are addressed and provide useful, meaningful
 * responses, as well as to test a sunny day API call.  Uses the `nock` library to mock the API calls being made.
 */

/**
 * This is a suite of tests designed to test the AccuWeather API configuration.  This tests creating a new API instance
 * with invalid credentials, running an API call without providing a location ID, and a successful test.
 */
describe('AccuWeather API', () => {

    describe('Invalid API Key', () => {
        it('Undefined API key', () => {
            const undefinedDeclaration = () => { new AccuWeatherAPI(undefined) };
            expect(undefinedDeclaration).to.throw(AccuWeatherError);
        });

        it('Empty API key', () => {
            const emptyDeclaration = () => { new AccuWeatherAPI("") };
            expect(emptyDeclaration).to.throw(AccuWeatherError);
        });

        it('API key trims to empty', () => {
            const trimDeclaration = () => { new AccuWeatherAPI("     ") };
            expect(trimDeclaration).to.throw(AccuWeatherError);
        });
    });

    describe('Invalid Location ID', () => {
        it('Undefined location ID', () => {
            const undefinedDeclaration = () => { accuWeatherAPI.fetchCurrentConditions(undefined) };
            expect(undefinedDeclaration).to.throw(AccuWeatherError);
        });

        it('Empty location ID', () => {
            const emptyDeclaration = () => { accuWeatherAPI.fetchCurrentConditions("") };
            expect(emptyDeclaration).to.throw(AccuWeatherError);
        });

        it('Location ID trims to empty', () => {
            const trimDeclaration = () => { accuWeatherAPI.fetchCurrentConditions("     ") };
            expect(trimDeclaration).to.throw(AccuWeatherError);
        });
    });

    describe('Successful Integration', () => {
        before(() => {
            nock(AccuWeatherAPI.apiUrl)
                .get(`/currentconditions/v1/${locationId}`)
                .query({apikey: apiKey})
                .reply(200, responses["200"]);
        });

        it('Current weather conditions are fetched.', (done) => {
            accuWeatherAPI.fetchCurrentConditions(locationId)
                .then(({ body }) => {
                    const weatherResponse = body[0];
                    expect(weatherResponse.WeatherText).to.equal("Partly cloudy");
                    expect(weatherResponse.HasPrecipitation).to.equal(false);
                    expect(weatherResponse.PrecipitationType).to.equal(null);
                    expect(weatherResponse.Temperature.Imperial.Value).to.equal(62);
                    expect(weatherResponse.Temperature.Metric.Value).to.equal(16.7);
                    expect(weatherResponse.Link).to.equal("http://www.accuweather.com/en/us/new-york-ny/10007/current-weather/349727?lang=en-us");
                    done();
                });
        });
    });
});

/**
 * This is a suite of tests designed to test the conversion of AccuWeather JSON responses to a BigPanda alert payload.
 * This tests attempting JSON conversion with a bad location name, bad location IDs, and bad JSON responses, in addition to
 * a sunny day test that ensures that the data is formatted correctly.
 */
describe('AccuWeather JSON Conversion', () => {
    describe('Invalid Location Name', () => {
        it('Undefined location name', () => {
            const undefinedDeclaration = () => { accuWeatherAPI.formatConditionsAsBigPandaAlert(undefined, locationId, responses["200"][0]) };
            expect(undefinedDeclaration).to.throw(AccuWeatherError, "location name");
        });

        it('Empty location name', () => {
            const emptyDeclaration = () => { accuWeatherAPI.formatConditionsAsBigPandaAlert("", locationId, responses["200"][0]) };
            expect(emptyDeclaration).to.throw(AccuWeatherError, "location name");
        });

        it('Location name trims to empty', () => {
            const trimDeclaration = () => { accuWeatherAPI.formatConditionsAsBigPandaAlert("     ", locationId, responses["200"][0]) };
            expect(trimDeclaration).to.throw(AccuWeatherError, "location name");
        });
    });

    describe('Invalid Location ID', () => {
        it('Undefined location ID', () => {
            const undefinedDeclaration = () => { accuWeatherAPI.formatConditionsAsBigPandaAlert(location_name, undefined, responses["200"][0]) };
            expect(undefinedDeclaration).to.throw(AccuWeatherError, "location ID");
        });

        it('Empty location ID', () => {
            const emptyDeclaration = () => { accuWeatherAPI.formatConditionsAsBigPandaAlert(location_name, "", responses["200"][0]) };
            expect(emptyDeclaration).to.throw(AccuWeatherError, "location ID");
        });

        it('Location ID trims to empty', () => {
            const trimDeclaration = () => { accuWeatherAPI.formatConditionsAsBigPandaAlert(location_name, "     ", responses["200"][0]) };
            expect(trimDeclaration).to.throw(AccuWeatherError, "location ID");
        });
    });

    describe('Invalid JSON', () => {
        it('Undefined JSON', () => {
            const undefinedDeclaration = () => { accuWeatherAPI.formatConditionsAsBigPandaAlert(location_name, locationId, undefined) };
            expect(undefinedDeclaration).to.throw(AccuWeatherError, "valid response");
        });

        it('Empty JSON', () => {
            const emptyDeclaration = () => { accuWeatherAPI.formatConditionsAsBigPandaAlert(location_name, locationId, {}) };
            expect(emptyDeclaration).to.throw(AccuWeatherError, "valid response");
        });
    });

    describe('Successful Conversion', () => {
        it('JSON is successfully converted to a BigPanda alert.', (done) => {
            sinon.stub(Math, "random").returns(1);
            accuWeatherAPI.formatConditionsAsBigPandaAlert(location_name, locationId, responses["200"][0])
                .then((alertJSON) => {
                    expect(JSON.stringify(alertJSON)).to.equal(JSON.stringify(responses["bigPandaAlert"]));
                    done();
                })
                .catch((err) => done(err));
        });
    });
});
