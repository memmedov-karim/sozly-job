// src/config/rabbit.ts
import amqp from "amqplib";

var channel: amqp.Channel;

const RABBITMQ_URL = process.env.RABBITMQ_URL;

if (!RABBITMQ_URL) {
  throw new Error("RABBITMQ_URL is not set");
}

export const connectRabbitMQ = async () => {
  const connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();

  console.log("Connected to RabbitMQ");
  return channel;
};

export function getChannel(): amqp.Channel {
  return channel;
}
