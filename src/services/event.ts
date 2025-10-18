import ChatSession from '../models/ChatSession';
import UserSession from '../models/UserSession';
import SiteUsage from '../models/SiteUsage';
import Location from '../models/Location';
import { getUserLocation } from '../client/GetUserLocation';
import { mapToLocationData } from '../mapper/GeoLocationMapper';
import { DB_EVENTS } from '../constants/event';

export async function processEvent(
  queueName: string,
  event: any
): Promise<void> {
  console.log(`Processing event from ${queueName}:`, event);

  try {
    switch (queueName) {
      case DB_EVENTS.USER_CONNECTED:
        await handleUserConnected(event);
        break;

      case DB_EVENTS.USER_DISCONNECTED:
        await handleUserDisconnected(event);
        break;

      case DB_EVENTS.USER_JOINED_QUEUE:
        await handleUserJoinedQueue(event);
        break;

      case DB_EVENTS.USER_LEFT_QUEUE:
        await handleUserLeftQueue(event);
        break;

      case DB_EVENTS.MATCH_CREATED:
        await handleMatchCreated(event);
        break;

      case DB_EVENTS.MATCH_ACCEPTED:
        await handleMatchAccepted(event);
        break;

      case DB_EVENTS.MATCH_REJECTED:
        await handleMatchRejected(event);
        break;

      case DB_EVENTS.CHAT_ENDED:
        await handleChatEnded(event);
        break;

      case DB_EVENTS.MESSAGE_SENT:
        await handleMessageSent(event);
        break;

      default:
        console.warn(`Unknown queue: ${queueName}`);
    }
  } catch (error) {
    console.error(`Error processing event from ${queueName}:`, error);
    throw error; // Re-throw to handle at consumer level if needed
  }
}

async function handleUserConnected(data: {
  count: string;
  timestamp: Date;
  metricType: string;
  ip: string;
}): Promise<void> {
  try {
    await Promise.all([
      new SiteUsage({
        count: data.count,
        timestamp: new Date(data.timestamp),
        metricType: data.metricType,
        ip: data.ip,
      }).save(),

      (async () => {
        const locationData = await getUserLocation(data.ip);
        if (locationData) {
          await new Location({
            data: { ...mapToLocationData(locationData), ip: data.ip },
          }).save();
        }
      })(),
    ]);

    console.log('DB: User connected event processed');
  } catch (error) {
    console.error('Error handling user connected event:', error);
    throw error;
  }
}

async function handleUserDisconnected(data: {
  socketId: string;
  timestamp: Date;
}): Promise<void> {
  try {
    await UserSession.findOneAndUpdate(
      { socketId: data.socketId },
      {
        isOnline: false,
        lastSeen: data.timestamp,
      }
    );

    console.log(`DB: User ${data.socketId} marked as offline`);
  } catch (error) {
    console.error('Error handling user disconnected event:', error);
    throw error;
  }
}

async function handleUserJoinedQueue(data: {
  socketId: string;
  ip: string;
  preferences: any;
  location?: any;
  timestamp: Date;
}): Promise<void> {
  try {
    await UserSession.findOneAndUpdate(
      { socketId: data.socketId },
      {
        socketId: data.socketId,
        ip: data.ip,
        preferences: data.preferences,
        isOnline: true,
        lastSeen: data.timestamp,
        location: data.location,
      },
      { upsert: true, new: true }
    );

    console.log(`DB: User ${data.socketId} joined queue`);
  } catch (error) {
    console.error('Error handling user joined queue event:', error);
    throw error;
  }
}

async function handleUserLeftQueue(data: {
  socketId: string;
  timestamp: Date;
}): Promise<void> {
  try {
    // Track queue leaving statistics if needed
    console.log(`DB: User ${data.socketId} left queue`);
  } catch (error) {
    console.error('Error handling user left queue event:', error);
    throw error;
  }
}

async function handleMatchCreated(data: {
  sessionId: string;
  users: Array<{ id: string; ip: string }>;
  language: string;
  topics: string[];
  chatType: string;
  timestamp: Date;
}): Promise<void> {
  try {
    await new ChatSession({
      sessionId: data.sessionId,
      users: data.users,
      status: 'waiting',
      language: data.language,
      topics: data.topics,
      chatType: data.chatType,
      startedAt: data.timestamp,
    }).save();

    console.log(`DB: Match created ${data.sessionId}`);
  } catch (error) {
    console.error('Error handling match created event:', error);
    throw error;
  }
}

async function handleMatchAccepted(data: {
  sessionId: string;
  acceptedBy: string;
  timestamp: Date;
}): Promise<void> {
  try {
    await ChatSession.findOneAndUpdate(
      { sessionId: data.sessionId },
      {
        status: 'connected',
        acceptedAt: data.timestamp,
      }
    );

    console.log(`DB: Match accepted ${data.sessionId} by ${data.acceptedBy}`);
  } catch (error) {
    console.error('Error handling match accepted event:', error);
    throw error;
  }
}

async function handleMatchRejected(data: {
  sessionId: string;
  rejectedBy: string;
  timestamp: Date;
}): Promise<void> {
  try {
    await ChatSession.findOneAndUpdate(
      { sessionId: data.sessionId },
      {
        status: 'rejected',
        rejectedBy: data.rejectedBy,
        endedAt: data.timestamp,
      }
    );

    console.log(`DB: Match rejected ${data.sessionId} by ${data.rejectedBy}`);
  } catch (error) {
    console.error('Error handling match rejected event:', error);
    throw error;
  }
}

async function handleChatEnded(data: {
  sessionId: string;
  endedBy: string;
  timestamp: Date;
}): Promise<void> {
  try {

    const chatSession = await ChatSession.findOneAndUpdate(
      { sessionId: data.sessionId },
      {
        status: 'ended',
        endedAt: new Date(data.timestamp),
      },
      { new: true }
    );

    if (chatSession && chatSession.startedAt) {
      const duration = new Date(data.timestamp).getTime() - chatSession.startedAt.getTime();
      chatSession.duration = Math.floor(duration / 1000);
      await chatSession.save();
    }

    console.log(`DB: Chat ended ${data.sessionId} by ${data.endedBy}`);
  } catch (error) {
    console.error('Error handling chat ended event:', error);
    throw error;
  }
}

async function handleMessageSent(data: {
  sessionId: string;
  message: {
    from: string;
    text: string;
    timestamp: Date;
  };
}): Promise<void> {
  try {
    await ChatSession.findOneAndUpdate(
      { sessionId: data.sessionId },
      { $push: { messages: data.message } },
      { new: true }
    );

    console.log(`DB: Message saved in session ${data.sessionId}`);
  } catch (error) {
    console.error('Error handling message sent event:', error);
    throw error;
  }
}