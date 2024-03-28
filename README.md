# chat-stream-ts

This project provides a chat stream interface for the llama.cpp library. It's written in TypeScript and runs on Node.js. It uses large language models in the GGUF format which can be downloaded from huggingface.co (e.g. https://huggingface.co/TheBloke/openchat_3.5-GGUF). Each model's information needs to be added to `settings.json` before it can be used.

## Installation

To install the project, clone the repository and run `npm install`:

```bash
git clone https://github.com/Ivan-Kouznetsov/chat-stream-ts.git
cd chat-stream-ts
npm install
```

## Usage

You can start a local server with the following command:

```bash
npm run server
```

You can also run the chat in the terminal with the following command:

```bash
npm run chat
```

## Testing

To run the tests, use the following command:

```bash
npm run test
```

## Contributing

If you find a bug or want to contribute to the code, please submit an issue or a pull request.

## License

This project is licensed under the MIT License.
