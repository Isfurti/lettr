import { google } from "googleapis";
import { getUserById, setGoogleTokens } from "./db";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set. Add them to your .env.local (local dev) or your hosting provider's environment variables (production) to enable Google Drive export."
    );
  }
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return new google.auth.OAuth2(clientId, clientSecret, `${appUrl}/api/google/callback`);
}

/** Builds the URL to send the user to for Google Drive consent. */
export function buildGoogleAuthUrl(state: string): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline", // required to get a refresh_token
    prompt: "consent", // force refresh_token on every connect, not just the first time
    scope: SCOPES,
    state,
  });
}

/** Exchanges an OAuth callback code for tokens and stores them for the user. */
export async function connectGoogleDriveForUser(userId: string, code: string): Promise<void> {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("Google did not return an access token");
  }

  await setGoogleTokens({
    userId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiryDate: new Date(tokens.expiry_date ?? Date.now() + 3500 * 1000),
  });
}

/**
 * Returns a valid access token for the user, refreshing it first if it's
 * expired or close to expiring. Throws if the user hasn't connected Drive.
 */
export async function getValidGoogleAccessToken(userId: string): Promise<string> {
  const user = await getUserById(userId);
  if (!user?.google_refresh_token) {
    throw new Error("Google Drive is not connected for this account yet.");
  }

  const expiry = user.google_token_expiry ? new Date(user.google_token_expiry).getTime() : 0;
  const stillValid = user.google_access_token && expiry - Date.now() > 60_000; // 60s buffer
  if (stillValid) return user.google_access_token as string;

  const client = getOAuthClient();
  client.setCredentials({ refresh_token: user.google_refresh_token });
  const { credentials } = await client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error("Failed to refresh Google access token");
  }

  await setGoogleTokens({
    userId,
    accessToken: credentials.access_token,
    expiryDate: new Date(credentials.expiry_date ?? Date.now() + 3500 * 1000),
  });

  return credentials.access_token;
}

/** Uploads a file buffer to the user's Google Drive, returns the file's webViewLink. */
export async function uploadFileToDrive(params: {
  accessToken: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{ id: string; webViewLink: string }> {
  const client = getOAuthClient();
  client.setCredentials({ access_token: params.accessToken });
  const drive = google.drive({ version: "v3", auth: client });

  const { Readable } = await import("node:stream");
  const res = await drive.files.create({
    requestBody: { name: params.filename },
    media: { mimeType: params.mimeType, body: Readable.from(params.buffer) },
    fields: "id, webViewLink",
  });

  if (!res.data.id || !res.data.webViewLink) {
    throw new Error("Google Drive did not return a file id/link after upload");
  }

  return { id: res.data.id, webViewLink: res.data.webViewLink };
}
