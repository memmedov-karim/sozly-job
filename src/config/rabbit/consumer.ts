// src/rabbit/consumer.ts
import { getChannel } from './rabbit';
import {processEvent} from "../../services/event";
import { DB_EVENTS } from '../../constants/event';

const QUEUES = Object.values(DB_EVENTS);

export const startConsumer = async () => {
  const channel = getChannel();

  for (const QUEUE_NAME of QUEUES) {
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    channel.consume(QUEUE_NAME, (msg) => {
      if (msg) {
        const event = JSON.parse(msg.content.toString());
        processEvent(QUEUE_NAME, event);
        channel.ack(msg);
      }
    });

    console.log(`Listening for events on queue: ${QUEUE_NAME}`);
  }
};
