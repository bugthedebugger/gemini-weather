// import dotenv and apply config
import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";
import readline from 'readline';

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Weather API:
 * http://api.weatherstack.com/current
    ? access_key = 789aba86ce845568a9d2beef3e67344e
    & query = New York
 */
const getWeather = async (location) => {
    // get weather data from api
    const response = await fetch(`http://api.weatherstack.com/current?access_key=${process.env.WEATHER_API_KEY}&query=${location}`);
    const data = await response.json();
    
    // return weather data
    return data;
};

/**
 * Weather forecast API:
 * http://api.weatherstack.com/forecast
    ? access_key = 789aba86ce845568a9d2beef3e67344e
    & query = New York
    & forecast_days = 1
    & hourly = 1
 */

// Function to get weather forecast
const getWeatherForecast = async (location, days, hours) => {
    // get weather forecast data from api
    const response = await fetch(`http://api.weatherstack.com/forecast?access_key=${process.env.WEATHER_API_KEY}&query=${location}&forecast_days=${days}&hourly=${hours}`);
    const data = await response.json();
    
    // return weather forecast data
    return data;
};

// Function declaration for weather
const weatherFunctionDeclaration = {
    name: "getWeather",
    parameters: {
        type: "OBJECT",
        description: "Get the current weather for a given location.",
        properties: {
            location: {
                type: "STRING",
                description: "Location of where we want to know the weather.",
            },
        },
        required: ["location"],
    }
};

// Function declaration for weather forecast
const weatherForecastFunctionDeclaration = {
    name: "getWeatherForecast",
    parameters: {
        type: "OBJECT",
        description: "Get the weather forecast for a given location.",
        properties: {
            location: {
                type: "STRING",
                description: "Location of where we want to know the weather forecast.",
            },
            days: {
                type: "NUMBER",
                description: "Number of days for the forecast.",
            },
            hours: {
                type: "NUMBER",
                description: "Number of hours to segment the data by, if nothing provided use 1 for default.",
            },
        },
        required: ["location", "days", "hours"],
    }
};

// Executable function code. Put it in a map keyed by the function name
// so that you can call it once you get the name string from the model.
const functions = {
    getWeather: ({ location }) => {
        return getWeather(location);
    },
    getWeatherForecast: ({ location, days, hours }) => {
        return getWeatherForecast(location, days, hours);
    },
};

const generativeModel = genAI.getGenerativeModel({
    // Use a model that supports function calling, like a Gemini 1.5 model
    model: "gemini-1.5-flash-8b",
    systemInstruction: "Your sole purpose is to provide weather information. User will ask for weather for particular location. Use the weather function avaialbel to you to get the weather information.",
    // Specify the function declaration.
    tools: {
        functionDeclarations: [weatherFunctionDeclaration, weatherForecastFunctionDeclaration],
    },
});

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Create chat instance
const chat = generativeModel.startChat();

// Function to handle user input
async function processUserInput(input) {
    try {
        // Send the message to the model
        const result = await chat.sendMessage(input);

        // For simplicity, this uses the first function call found
        const calls = result.response.functionCalls();
        const call = calls?.[0];

        if (call) {
            // Call the executable function named in the function call
            const apiResponse = await functions[call.name](call.args);

            // Send the API response back to the model
            const result2 = await chat.sendMessage([{
                functionResponse: {
                    name: 'weather',
                    response: apiResponse
                }
            }]);

            // Log the text response
            console.log('\nAI:', result2.response.text());
        } else {
            // Log the text response
            console.log('\nAI:', result.response.text());
        }
    } catch (error) {
        console.error('Error:', error);
    }
    
    // Prompt for next input
    askQuestion();
}

// Function to ask question
function askQuestion() {
    rl.question('\nYou: ', (input) => {
        if (input.toLowerCase() === 'exit') {
            rl.close();
            return;
        }
        processUserInput(input);
    });
}

// Start the conversation
console.log('Welcome to Weather Chat! (Type "exit" to quit)');
askQuestion();
