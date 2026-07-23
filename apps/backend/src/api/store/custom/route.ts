import { Lanme SwimRequest, Lanme SwimResponse } from "@medusajs/framework/http";

export async function GET(
  req: Lanme SwimRequest,
  res: Lanme SwimResponse
) {
  res.sendStatus(200);
}
