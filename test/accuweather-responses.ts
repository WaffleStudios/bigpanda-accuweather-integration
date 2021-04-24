module.exports = {
    200: [{
        LocalObservationDateTime: "2021-04-20T22:40:00-04:00",
        EpochTime: 1618976393,
        WeatherText: "Partly cloudy",
        WeatherIcon: 3,
        HasPrecipitation: false,
        PrecipitationType: null,
        IsDayTime: false,
        Temperature: {
            Metric: {
                Value: 16.7,
                Unit: "C",
                UnitType: 17,
            },
            Imperial: {
                Value: 62,
                Unit: "F",
                UnitType: 18,
            },
        },
        MobileLink: "http://m.accuweather.com/en/us/new-york-ny/10007/current-weather/349727?lang=en-us",
        Link: "http://www.accuweather.com/en/us/new-york-ny/10007/current-weather/349727?lang=en-us",
    }],
    bigPandaAlert: {
        host: "location",
        status: "warning",
        check: "Partly cloudy",
        incident_identifier: "location_id",
        condition: "Partly cloudy",
        precipitation: false,
        precipitation_type: null,
        link: "http://www.accuweather.com/en/us/new-york-ny/10007/current-weather/349727?lang=en-us",
        temperature_celsius: 16.7,
        temperature_farenheit: 62
    }
};
