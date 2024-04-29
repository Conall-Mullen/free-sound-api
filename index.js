const dgram = require("dgram");
const axios = require("axios");

// UDP server settings
const UDP_PORT_RECEIVE = 7400; // Port to receive messages from Max MSP
const UDP_PORT_SEND = 8080; // Port to send messages to Max MSP

// Create UDP server for receiving messages from Max MSP
const server = dgram.createSocket("udp4");

server.on("error", (err) => {
  console.log(`UDP server error:\n${err.stack}`);
  server.close();
});

server.on("message", async (msg, rinfo) => {
  const messageFromMax = msg.toString().replace(/[\x00\,]+/g, ""); //This replace method is shorten the message to only include the text characters
  console.log(`Received message from Max MSP: ${messageFromMax}`);

  try {
    // Query FreeSound API with the received message
    const response = await axios.get(
      "https://freesound.org/apiv2/search/text/",
      {
        params: {
          query: messageFromMax,
          token: "CkcBO41PGHhxqwJOzDI2GhmdYakApI4jxI253Upt",
        },
      }
    );

    // Extract relevant data from the FreeSound API response
    const results = response.data.results.map((result) => ({
      name: result.name,
      url: result.url,
    }));

    // Prepare the response message
    const responseData = JSON.toString(results);

    // console.log(`Sending response to Max MSP: ${results}`);

    // Send the response to Max MSP
    const client = dgram.createSocket("udp4");
    results.forEach((result) => {
      //   console.log(result.name);
      const buff = Buffer.from(result.name.padEnd(31, "\0")).toString();

      console.log(typeof buff);
      client.send(`${buff}\n`, UDP_PORT_SEND, "localhost");
    });
  } catch (error) {
    console.error(`Error querying FreeSound API: ${error.message}`);
  }
});

// Start UDP server for receiving messages from Max MSP
server.bind(UDP_PORT_RECEIVE, () => {
  console.log(
    `UDP server listening for messages from Max MSP on port ${UDP_PORT_RECEIVE}`
  );
});
