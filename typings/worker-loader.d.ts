// https://github.com/webpack-contrib/worker-loader/tree/edca167d18d15977165164e0ed67f49c4477a3d4#integrating-with-typescript
declare module "worker-loader*" {
  class WebpackWorker extends Worker {
    constructor();
  }

  export = WebpackWorker;
}
