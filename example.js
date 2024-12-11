import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function setLightValues(brightness, colorTemp) {
    // This mock API returns the requested lighting values
    return {
        brightness: brightness,
        colorTemperature: colorTemp
    };
}


const controlLightFunctionDeclaration = {
    name: "controlLight",
    parameters: {
        type: "OBJECT",
        description: "Set the brightness and color temperature of a room light.",
        properties: {
            brightness: {
                type: "NUMBER",
                description: "Light level from 0 to 100. Zero is off and 100 is full brightness.",
            },
            colorTemperature: {
                type: "STRING",
                description: "Color temperature of the light fixture which can be `daylight`, `cool` or `warm`.",
            },
        },
        required: ["brightness", "colorTemperature"],
    },
};

  // Executable function code. Put it in a map keyed by the function name
  // so that you can call it once you get the name string from the model.
const functions = {
    controlLight: ({ brightness, colorTemperature }) => {
        return setLightValues( brightness, colorTemperature)
    }
};


const generativeModel = genAI.getGenerativeModel({
    // Use a model that supports function calling, like a Gemini 1.5 model
    model: "gemini-1.5-flash",
    // Specify the function declaration.
    tools: {
        functionDeclarations: [controlLightFunctionDeclaration],
    },
});


const chat = generativeModel.startChat();
const prompt = "Dim the lights so the room feels cozy and warm.";

// Send the message to the model.
const result = await chat.sendMessage(prompt);

// For simplicity, this uses the first function call found.
const call = result.response.functionCalls()[0];

if (call) {
    // Call the executable function named in the function call
    // with the arguments specified in the function call and
    // let it call the hypothetical API.
    const apiResponse = await functions[call.name](call.args);

    // Send the API response back to the model so it can generate
    // a text response that can be displayed to the user.
    const result2 = await chat.sendMessage([{functionResponse: {
        name: 'controlLight',
        response: apiResponse
    }}]);

    // Log the text response.
    console.log(result2.response.text());
}
