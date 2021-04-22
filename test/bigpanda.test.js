const { BigPandaAPI, BigPandaError } = require("../src/apis/bigpanda");

const { expect } = require('chai');
const nock = require('nock');
const responses = require('./bigpanda-responses');

const bearerToken = "bearer_token";
const appKey = "app_key";

const alertPayload = {
    app_key: 'test_app_key',
    status: 'warning',
    host: 'test_location',
    check: 'Weather Check',
    incident_identifier: 'test_location_id',
    condition: 'Partly sunny',
    precipitation: false,
    precipitation_type: null,
    link: 'http://www.accuweather.com/en/us/new-york-ny/10007/current-weather/349727?lang=en-us',
};

const bigPandaAPI = new BigPandaAPI(bearerToken);

/**
 * Unit tests exist to make sure that the code is running correctly and that anticipated errors can be handled and rerouted
 * correctly.  I'm using these tests to make sure that all of my problem cases are addressed and provide useful, meaningful
 * responses, as well as to test a sunny day API call.  Uses the `nock` library to mock the API calls being made.
 */
describe('BigPanda', () => {
    describe('Invalid Bearer Token', () => {
        it('Undefined bearer token', () => {
            const undefinedDeclaration = () => { new BigPandaAPI() };
            expect(undefinedDeclaration).to.throw(BigPandaError, "Bearer Token");
        });

        it('Empty bearer token', () => {
            const emptyDeclaration = () => { new BigPandaAPI("") };
            expect(emptyDeclaration).to.throw(BigPandaError, "Bearer Token");
        });

        it('Bearer token trims to empty', () => {
            const trimDeclaration = () => { new BigPandaAPI("     ") };
            expect(trimDeclaration).to.throw(BigPandaError, "Bearer Token");
        });
    });

    describe('Invalid App Key', () => {
        it('Undefined app key', () => {
            const undefinedDeclaration = () => { bigPandaAPI.sendAlert(undefined, alertPayload) };
            expect(undefinedDeclaration).to.throw(BigPandaError, "App Key");
        });

        it('Empty app key', () => {
            const emptyDeclaration = () => { bigPandaAPI.sendAlert("", alertPayload) };
            expect(emptyDeclaration).to.throw(BigPandaError, "App Key");
        });

        it('App key trims to empty', () => {
            const trimDeclaration = () => { bigPandaAPI.sendAlert("     ", alertPayload) };
            expect(trimDeclaration).to.throw(BigPandaError, "App Key");
        });
    });

    describe('Invalid JSON', () => {
        it('JSON not provided', () => {
            const undefinedDeclaration = () => { bigPandaAPI.sendAlert(appKey, undefined) };
            expect(undefinedDeclaration).to.throw(BigPandaError, "provide");
        });

        it('JSON provided is empty', () => {
            const emptyDeclaration = () => { bigPandaAPI.sendAlert(appKey, {}) };
            expect(emptyDeclaration).to.throw(BigPandaError, "missing");
        });

        it('JSON provided is an Array', () => {
            const arrayDeclaration = () => { bigPandaAPI.sendAlert(appKey, [alertPayload]) };
            expect(arrayDeclaration).to.throw(BigPandaError, "Array");
        });

        it('Array is missing "host"', () => {
            let noHostJSON = { ...alertPayload };
            delete noHostJSON["host"];

            const noHostDeclaration = () => { bigPandaAPI.sendAlert(appKey, noHostJSON) };
            expect(noHostDeclaration).to.throw(BigPandaError, "\"host\"");
        });

        it('Array is missing "status"', () => {
            let noStatusJSON = { ...alertPayload };
            delete noStatusJSON["status"];

            const noStatusDeclaration = () => { bigPandaAPI.sendAlert(appKey, noStatusJSON) };
            expect(noStatusDeclaration).to.throw(BigPandaError, "\"status\"");
        });
    });

    describe('Successful Integration', () => {
        before(() => {
            nock(BigPandaAPI.apiUrl)
                .post("/data/v2/alerts")
                .reply(201, responses["201"]);
        });

        it('Alert is successfully sent.', (done) => {
            bigPandaAPI.sendAlert(appKey, alertPayload)
                .then(({ body, statusCode }) => {
                    expect(statusCode).to.equal(201);
                    expect(JSON.stringify(body)).to.equal(JSON.stringify(responses["201"]));
                    done();
                })
                .catch((err) => done(err));
        });
    });
});
