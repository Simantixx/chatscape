const AWS = require("aws-sdk");
const { handler } = require("./main.js");

jest.mock("aws-sdk", () => {
  const mockDynamoDB = {
    DocumentClient: jest.fn(() => ({
      put: jest.fn().mockReturnThis(),
      promise: jest.fn(),
    })),
  };

  return {
    DynamoDB: mockDynamoDB,
  };
});

describe("Lambda Function Tests", () => {
  let mockEvent;

  const mockContext = {};

  beforeEach(() => {
    mockEvent = {
      httpMethod: "POST",
      body: JSON.stringify({
        senderNamespace: "sender-namespace",
        recipientNamespace: "recipient-namespace",
        message: "Test message",
      }),
    };
    
    AWS.DynamoDB.DocumentClient.mockClear();
  });

  it("should handle valid request", async () => {
    const response = await handler(mockEvent, mockContext);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      senderNamespace: "sender-namespace",
      recipientNamespace: "recipient-namespace",
      message: "Test message",
    });
  });

  it("should handle missing message", async () => {
    mockEvent.body = JSON.stringify({
      senderNamespace: "sender-namespace",
      recipientNamespace: "recipient-namespace",
      message: "",
    });

    const response = await handler(mockEvent, mockContext);

    expect(response.statusCode).toBe(400);
    expect(response.body).toContain("message is empty");
  });

  it("should handle invalid request body", async () => {
    mockEvent.body = "invalid_json";

    const response = await handler(mockEvent, mockContext);

    expect(response.statusCode).toBe(400);
    expect(response.body).toContain("invalid request body");
  });

  it("should handle unsupported HTTP method", async () => {
    mockEvent.httpMethod = "GET";

    const response = await handler(mockEvent, mockContext);

    expect(response.statusCode).toBe(405);
    expect(response.body).toContain("method not allowed");
  });
});