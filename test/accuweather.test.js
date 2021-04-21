const { AccuWeatherAPI, AccuWeatherError } = require("../src/apis/accuweather");

const { expect } = require('chai');
const nock = require('nock');
const responses = require('./accuweather-responses');

const locationId = "location_id";
const apiKey = "api_key";

/**
 * Unit tests exist to make sure that the code is running correctly and that anticipated errors can be handled and rerouted
 * correctly.  I'm using these tests to make sure that all of my problem cases are addressed and provide useful, meaningful
 * responses, as well as to test a sunny day API call.  Uses the `nock` library to mock the API calls being made.
 */
describe('AccuWeather', () => {
    describe('Invalid API Key', () => {
        it('Undefined API key', () => {
            const undefinedDeclaration = () => { new AccuWeatherAPI() };
            expect(undefinedDeclaration).to.throw(AccuWeatherError);
        });

        it('Empty API key', () => {
            const emptyDeclaration = () => { new AccuWeatherAPI('') };
            expect(emptyDeclaration).to.throw(AccuWeatherError);
        });

        it('API key trims to empty', () => {
            const trimDeclaration = () => { new AccuWeatherAPI('     ') };
            expect(trimDeclaration).to.throw(AccuWeatherError);
        });
    });

    describe('Invalid Location ID', () => {
        it('Undefined location ID', () => {
            const accuWeatherAPI = new AccuWeatherAPI(apiKey);
            const undefinedDeclaration = () => { accuWeatherAPI.fetchCurrentConditions() };
            expect(undefinedDeclaration).to.throw(AccuWeatherError);
        });

        it('Empty location ID', () => {
            const accuWeatherAPI = new AccuWeatherAPI(apiKey);
            const emptyDeclaration = () => { accuWeatherAPI.fetchCurrentConditions('') };
            expect(emptyDeclaration).to.throw(AccuWeatherError);
        });

        it('Location ID trims to empty', () => {
            const accuWeatherAPI = new AccuWeatherAPI(apiKey);
            const trimDeclaration = () => { accuWeatherAPI.fetchCurrentConditions('     ') };
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
            const accuWeatherAPI = new AccuWeatherAPI(apiKey);
            accuWeatherAPI.fetchCurrentConditions(locationId)
                .then(({ body }) => {
                    const weatherResponse = body[0];
                    expect(weatherResponse.WeatherText).to.equal('Partly cloudy');
                    expect(weatherResponse.HasPrecipitation).to.equal(false);
                    expect(weatherResponse.PrecipitationType).to.equal(null);
                    expect(weatherResponse.Temperature.Imperial.Value).to.equal(62);
                    expect(weatherResponse.Temperature.Metric.Value).to.equal(16.7);
                    expect(weatherResponse.Link).to.equal('http://www.accuweather.com/en/us/new-york-ny/10007/current-weather/349727?lang=en-us');
                    done();
                });
        });
    });
});
