# Telegram Bot that Sell Subscriptions, Sell Domains, Shorten Links (Programming and DevOps work)

![Telegram Link Shortener Bot](notes/bot.png)

Welcome to the Telegram Link Shortener Bot project! This bot allows users to shorten URLs using a simple command. It's built with Node.js, the Telegram Bot API, and MongoDB for data storage.

## Getting Started

1. Clone this repository: `git clone https://github.com/softmuneeb/tg-bot-link-shorten`
2. Install dependencies: `npm install`
3. Set up environment variables: Create a `.env` file in the project root and provide your Telegram Bot Token, MongoDB credentials, and other necessary settings.
4. To expose local server for testing ../../Downloads/./ngrok http --domain=turtle-allowed-ladybug.ngrok-free.app 4005
5. Start the bot: `npm start`

## Commands

Commands for Admins:
1. Block User
2. Unblock User
3. View Users
4. View Analytics

Commands for Normal Users:
1. Shorten a URL
2. Buy a domain name
3. Subscribe to plans
4. View my subscribed plan
5. View my shortened links
6. View my domains

## Technology Stack

- JavaScript: Serves as the foundational development language.
- Telegram Bot API: Enables the creation of a bot and facilitates message reception.
- Node.js: Empowers the development of both server-side logic and the bot itself in JavaScript.
- MongoDB: Used for persistently storing user data, ensuring it remains intact over time.
- GraphQL API: Employed to store domain-related data in Railway Hosting.
- npm: Facilitates the seamless installation of packages and dependencies.
- Blockbee API: Empowers the creation of crypto payments.
- Axios: Enables the invocation of various APIs.
- dotenv: Safely loads and manages environment variables.
- Express: Facilitates the establishment of endpoints for communication with payment gateways through webhooks.
- Fincra API: Used for the creation of bank payments.
- nanoid: Generates concise 5-digit unique identifiers.

## Contributing

If you're interested in contributing to this project, please read the [Contributing Guidelines](CONTRIBUTING.md) to get started.

## License

This project is licensed under the [MIT License](LICENSE).
