async function handler({ userId }) {
  // Redirect to the main updateSpamCount function
  return {
    error: "This endpoint is deprecated. Please use /api/updateSpamCount",
  };
}
export async function POST(request) {
  return handler(await request.json());
}