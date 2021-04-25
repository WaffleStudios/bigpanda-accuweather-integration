import { SQSHandler, SQSHandlerError } from "../src/api-handlers/sqs-handler";

import { expect } from "chai";

const sqsURL: string = "https://sqs.us-east-2.amazonaws.com/12345/test-queue";

const sqsHandler: SQSHandler = new SQSHandler(sqsURL);

/**
 * Tests to make sure that all of my problem cases are addressed and provide useful, meaningful
 * responses.
 */

/**
 * Most of the code in this class specifically relies on the AWS service running, so it's just method validity tests.
 */
describe('SQS Handler', () => {
    describe('Initializing with an Invalid URL', () => {
        it('Undefined URL', () => {
            const undefinedDeclaration = () => { new SQSHandler(undefined) };
            expect(undefinedDeclaration).to.throw(SQSHandlerError, "valid SQS URL");
        });

        it('Empty URL', () => {
            const emptyDeclaration = () => { new SQSHandler("") };
            expect(emptyDeclaration).to.throw(SQSHandlerError, "valid SQS URL");
        });

        it('Invalid SQS URL', () => {
            const invalidDeclaration = () => { new SQSHandler("https://not.an.amazon.com/12345/test-queue") };
            expect(invalidDeclaration).to.throw(SQSHandlerError, "valid SQS URL");
        });
    });

    describe('Trying to Send an Invalid Message', () => {
        it('Undefined message', () => {
            const undefinedDeclaration = () => { sqsHandler.sendMessage(0, undefined) };
            expect(undefinedDeclaration).to.throw(SQSHandlerError, "valid message");
        });

        it('Empty message', () => {
            const emptyDeclaration = () => { sqsHandler.sendMessage(0, "") };
            expect(emptyDeclaration).to.throw(SQSHandlerError, "valid message");
        });

        it('Message trims to empty', () => {
            const trimDeclaration = () => { sqsHandler.sendMessage(0, "     ") };
            expect(trimDeclaration).to.throw(SQSHandlerError, "valid message");
        });
    });
});
