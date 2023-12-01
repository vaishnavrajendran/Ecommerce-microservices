const express = require("express");
const mongoose = require("mongoose");
const app = express();
const amqp = require("amqplib");

const Order = require("./Order");
const isAuthenticated = require("../isAuthenticated");

const PORT = process.env.PORT_ONE || 9090;
app.use(express.json());

let channel, connection;

mongoose
  .connect("mongodb://0.0.0.0:27017/order-service")
  .then(console.log("Order Service DB Connected"));

function createOrder(products, userEmail) {
  let total = 0;
  for (let t = 0; t < products.length; ++t) {
    total += products[t].price;
  }
  const newOrder = new Order({
    products,
    user: userEmail,
    total_price: total,
  });
  newOrder.save();
  return newOrder;
}

async function connect() {
  const amqpServer = "amqp://localhost:5672";
  connection = await amqp.connect(amqpServer);
  channel = await connection.createChannel();
  await channel.assertQueue("ORDER");
}
connect().then(() => {
  channel.consume("ORDER", (data) => {
    console.log("[[Consuming ORDER queue]]");
    const { products, userEmail } = JSON.parse(data.content);
    const newOrder = createOrder(products, userEmail);
    channel.ack(data);
    channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify({ newOrder })));
  });
});

app.listen(PORT, () => {
  console.log(`Order Service Connected on ${PORT}`);
});
