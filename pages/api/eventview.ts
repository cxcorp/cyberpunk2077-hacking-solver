import type { NextApiRequest, NextApiResponse } from "next";
import querystring from "querystring";
import fetch from "node-fetch";
import crypto from "crypto";

const HOST = process.env.PAGEVIEW_HOST;
const TID = process.env.PAGEVIEW_TID;

const isEnabled = HOST && TID && process.env.UA_ENABLED === "true";

const grabIp = (req: NextApiRequest): string | undefined =>
  Array.isArray(req.headers["x-real-ip"])
    ? req.headers["x-real-ip"][0]
    : req.headers["x-real-ip"];

const getCid = (ip?: string, ua?: string): string => {
  const shasum = crypto.createHash("sha1");
  shasum.update(ip || "0.0.0.0");
  shasum.update(ua || "none");
  return shasum.digest("hex");
};

export default (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  if (!isEnabled) {
    return res.status(200).end();
  }

  const { dp = "/", evs } = req.body;
  const ip = grabIp(req);

  const queries = evs.map((ev) =>
    querystring.stringify({
      v: 1,
      t: "event",
      tid: TID,
      cid: getCid(ip, req.headers["user-agent"]),
      ...ev,
      dh: req.headers.host,
      dp,
      ua: req.headers["user-agent"],
      // anonymize IP at ingest point
      aip: 1,
      ...(ip ? { uip: ip } : {}),
    })
  );
  const query = queries.join("\n");

  return fetch(`https://${HOST}/batch`, { method: "POST", body: query })
    .then(() => {
      res.status(200).end();
    })
    .catch((e) => {
      console.error(e);
      res.status(200).end();
    });
};
