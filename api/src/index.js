import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";

const REGION = "sa-east-1";
const TABLE_NAME = "shorten-urls";
const DOMAIN = "http://shorten.martinmedica.com";

const client = new DynamoDBClient({ region: REGION });
const db = DynamoDBDocumentClient.from(client);

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

async function handleCreate(event) {
  const body = JSON.parse(event.body || "{}");
  const originalUrl = body.url;

  if (!originalUrl) {
    return jsonResponse(400, { error: "url is required" });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(originalUrl);
  } catch {
    return jsonResponse(400, { error: "invalid url" });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return jsonResponse(400, { error: "only http and https urls are allowed" });
  }

  const code = nanoid(7);

  await db.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        code,
        originalUrl: parsedUrl.toString(),
        createdAt: new Date().toISOString(),
      },
      ConditionExpression: "attribute_not_exists(code)",
    })
  );

  return jsonResponse(201, {
    code,
    shortUrl: `${DOMAIN}/${code}`,
  });
}

async function handleRedirect(event) {
  const code = event.pathParameters?.code;

  if (!code) {
    return jsonResponse(400, { error: "code is required" });
  }

  const result = await db.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { code },
    })
  );

  if (!result.Item) {
    return jsonResponse(404, { error: "short url not found" });
  }

  return {
    statusCode: 301,
    headers: {
      Location: result.Item.originalUrl,
    },
    body: "",
  };
}

export const handler = async (event) => {
  try {
    const method = event.requestContext.http.method;

    if (method === "POST") {
      return await handleCreate(event);
    }

    if (method === "GET") {
      return await handleRedirect(event);
    }

    return jsonResponse(405, { error: "method not allowed" });
  } catch (err) {
    console.error(err);
    return jsonResponse(500, { error: "internal server error" });
  }
};

