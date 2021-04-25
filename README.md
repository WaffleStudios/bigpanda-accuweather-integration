# AccuWeather → BigPanda Integration

## Description

A simple integration tool that retrieves weather information for a pre-selected group of locations, or single location
provided via an API call, from the AccuWeather API. The weather information is then formatted and integrated, through Amazon SQS, as a BigPanda alert

## Setup

There are two steps to begin using this tool.

1. Using the text editor of your choice, create a file named `.env` in the root directory of this project, and add the following lines, applying the specified API key as listed:
   
    ```
    # Required In-App
    BIGPANDA_API_KEY=${BigPanda Integration API Key}
    BIGPANDA_BEARER_TOKEN=${BigPanda Account Bearer Token}
    ACCUWEATHER_API_KEY=${AccuWeather App API Key}
    AWS_SQS_URL=${Primary SQS Queue URL}
    AWS_DLQ_URL=${Dead-Letter SQS Queue URL}
    
    # Optional, if configured at the system level
    AWS_ACCESS_KEY_ID=${AWS Account Access Key}
    AWS_SECRET_ACCESS_KEY=${AWS Account Secret Access Key}
    ```
 
2. Ensure that all of the required NPM libraries are installed.  To do so, run the following command:

    ```
    npm install
    ```
    
## Test

Before this tool makes API calls, we want to make sure that the required parameters are provided and valid.  In order to 
ensure this, this application has a test suite provided using Mocha and Chai.  In order to run the test suite, simply 
execute the following command inside of your Terminal window or API of choice: 

    npm test
    
## Run

This tool was built to support a number of use cases normally reserved for standalone microservices.  This was done in 
order to present a package that is  easy to demonstrate, as well as show a different number of ways that the tools could be used.
The scripts for this application have already been configured, so all that is required to run the app is to execute the 
following command inside of your Terminal window or IDE of choice. 

    npm start
    
Once the application has started, a lightweight API server will begin listening for calls.  In order to send alerts for
locations outside of the lists provided by the demonstration, you may send a `POST` call to http://localhost:3000/alert
with a JSON payload containing a location name and AccuWeather location ID (example payload: `{"locationName": "Austin", "locationID": "351193"}`).

Additionally, a maximum of two SQS consumers will begin running.  The first using the primary URL provided in the `.env`
file (`AWS_SQS_URL`).  The second will optionally consume information received from the Dead-Letter queue specified in the
`.env` file (`AWS_DLQ_URL`).  This is done by responding "y" to the prompt asking if you would like to run the Dead-Letter
queue.

Finally, as this tool was built for a specific exercise, the application will fetch and communicate weather alerts for a 
pre-set list of locations using the API described earlier. 
