// src/config/rabbit.ts
import amqp from 'amqplib';

var channel: amqp.Channel;

export const connectRabbitMQ = async () => {
  const connection = await amqp.connect('amqp://sozly_app:sozly_20012912M.s@213.199.33.9:5672');
  channel = await connection.createChannel();

  console.log('Connected to RabbitMQ');
  return channel;
};

export function getChannel(): amqp.Channel {
  return channel;
}