# AccuWeather -> BigPanda Integration

## Description
A simple integration tool that retrieves weather information for a pre-selected group of locations from the AccuWeather API and integrates the weather information, through Amazon SQS, as a BigPanda alert

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
    npm test
    
## Run
    npm start
