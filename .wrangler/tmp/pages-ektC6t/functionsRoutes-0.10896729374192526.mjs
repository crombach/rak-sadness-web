import { onRequest as __helloworld_ts_onRequest } from "/home/cullen/code/rak-sadness-web/functions/helloworld.ts";

export const routes = [
  {
    routePath: "/helloworld",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [__helloworld_ts_onRequest],
  },
];
