// src/rabbit/consumer.ts
import { DB_EVENTS } from "../../constants/event";
import { processEvent } from "../../services/event";
import { getChannel } from "./rabbit";

const QUEUES = Object.values(DB_EVENTS);

export const startConsumer = async () => {
  const channel = getChannel();

  for (const QUEUE_NAME of QUEUES) {
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg) {
        const event = JSON.parse(msg.content.toString());
        await processEvent(QUEUE_NAME, event);
        channel.ack(msg);
      }
    });

    console.log(`Listening for events on queue: ${QUEUE_NAME}`);
  }
};
