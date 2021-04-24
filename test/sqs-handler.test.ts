import { SQSHandler, SQSHandlerError } from "../src/api-handlers/sqs-handler";

import { expect } from "chai";

const sqsURL: string = "https://sqs.us-east-2.amazonaws.com/12345/test-queue";

const sqsHandler: SQSHandler = new SQSHandler(sqsURL);

/**
 * Unit tests exist to make sure that the code is running correctly and that anticipated errors can be handled and rerouted
 * correctly.  I'm using these tests to make sure that all of my problem cases are addressed and provide useful, meaningful
 * responses.  The rest of the code specifically relies on the AWS service running, so it's just method validity tests.
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
            const undefinedDeclaration = () => { sqsHandler.sendMessage(undefined) };
            expect(undefinedDeclaration).to.throw(SQSHandlerError, "valid message");
        });

        it('Empty message', () => {
            const emptyDeclaration = () => { sqsHandler.sendMessage("") };
            expect(emptyDeclaration).to.throw(SQSHandlerError, "valid message");
        });

        it('Message trims to empty', () => {
            const trimDeclaration = () => { sqsHandler.sendMessage("     ") };
            expect(trimDeclaration).to.throw(SQSHandlerError, "valid message");
        });
    });
});
