export type Env = {
  RAK_MADNESS_BUCKET: R2Bucket;
};

export function serviceUnavailable(message: string, error: unknown): Response {
  console.error(message, error);
  return new Response("Service Unavailable", { status: 503 });
}
