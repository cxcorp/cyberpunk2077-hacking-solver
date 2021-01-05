import type { NextApiRequest, NextApiResponse } from "next";
import querystring from "querystring";
import fetch from "node-fetch";

const HOST = process.env.PAGEVIEW_HOST;
const TID = process.env.PAGEVIEW_TID;

const isEnabled = HOST && TID && process.env.NODE_ENV === "production";

const grabIp = (req: NextApiRequest): string | undefined =>
  Array.isArray(req.headers["x-real-ip"])
    ? req.headers["x-real-ip"][0]
    : req.headers["x-real-ip"];

const anonymizeIp = (ip?: string) => {
  if (!ip || ip.includes(":")) {
    // ipv6?
    return undefined;
  }

  const octets = ip.split(".");
  if (octets.length !== 4) {
    return undefined;
  }
  octets[3] = "0";
  return octets.join(".");
};

export default (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  if (!isEnabled) {
    return res.status(200).end();
  }

  const { dp = "/" } = req.body;
  const ip = anonymizeIp(grabIp(req));

  const query = querystring.stringify({
    v: 1,
    t: "pageview",
    tid: TID,
    cid: 555, // anon client ID
    dh: req.headers.host,
    dp,
    ua: req.headers["user-agent"],
    ...(ip ? { uip: ip } : {}),
  });

  return fetch(`https://${HOST}/collect`, { method: "POST", body: query })
    .then(() => {
      res.status(200).end();
    })
    .catch((e) => {
      console.error(e);
      res.status(200).end();
    });
};
