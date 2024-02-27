const { OpenAI } = require("openai");
// create a new instance of Configuration
// by passing the organization and apiKey provided by OpenAI.
// const configuration = new Configuration({
//     organization: "org-7MPhMOWHIuaXBmGaCDpe7LxA",
//     apiKey: "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",
// });

// create a new instance of OpenAIApi by passing the configuration object.
// const openai = new OpenAI({
//     // organization: "org-7MPhMOWHIuaXBmGaCDpe7LxA",
//     apiKey: "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",
// });



// async function generateFormalText(yourText) {
//     try {
//         const completion = await openai.chat.completions.create({
//             messages: [
//                 { role: "user", content: yourText }, // Pass your text as a user message
//                 { role: "system", content: "Generate formal text." }
//             ],
//             model: "gpt-3.5-turbo",
//         });

//         const formalText = completion.choices[0].message.content;
//         console.log("Formal Text:", formalText);
//     } catch (error) {
//         console.error("Error generating formal text:", error);
//     }
// }

// const yourText = "Hello muneeb brother how are you";
// generateFormalText(yourText);

const axios = require('axios');

const OPENAI_API_KEY = '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'; // Replace 'your_openai_api_key' with your actual OpenAI API key

const data = {
    model: "gpt-3.5-turbo",
    messages: [
        {
            role: "system",
            content: "You are a poetic assistant, skilled in explaining complex programming concepts with creative flair."
        },
        {
            role: "user",
            content: "Compose a poem that explains the concept of recursion in programming."
        }
    ],
    max_tokens: 20
};

fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(data)
})
    .then(response => response.json())
    .then(data => {
        console.log(data.choices[0].message.content);
    })
    .catch(error => {
        console.error('Error:', error);
    });
