import { WorkerAction, WorkerResultAction } from "./cv-types";

export class CvWorker {
  loaded: boolean = false;
  worker: Worker;

  constructor(worker: Worker) {
    this.worker = worker;
  }

  private postAction = (action: WorkerAction, payload?: any) => {
    return this.worker.postMessage({ action, payload });
  };

  processScreenshot = (imageData: ImageData) => {
    if (!this.loaded) {
      throw new Error("CvWorker must be loaded before use!");
    }

    return new Promise<{
      comboImage: ImageData;
      codeMatrix: ImageData;
      sequences: ImageData;
    }>((resolve, reject) => {
      const self = this;

      const removeLoadResponseHandler = () =>
        self.worker.removeEventListener("message", catchResponse);

      function catchResponse(e: MessageEvent) {
        const action = e.data.action as WorkerResultAction;
        const payload = e.data.payload;

        if (action === "process_screenshot_success") {
          removeLoadResponseHandler();
          resolve(payload);
        } else if (action === "process_screenshot_error") {
          removeLoadResponseHandler();
          reject(payload);
        }
      }

      self.worker.addEventListener("message", catchResponse);
      self.postAction("process_screenshot", imageData);
    });
  };

  load = () => {
    if (this.loaded) {
      console.log("resolved");
      return Promise.resolve();
    }

    console.log("starting");
    return new Promise<void>((resolve, reject) => {
      const self = this;

      const removeLoadResponseHandler = () =>
        self.worker.removeEventListener("message", catchLoadResponse);

      function catchLoadResponse(e: MessageEvent<any>) {
        const { action, payload } = e.data;
        console.log("catchLoadResponse", e);

        if (action === "load_success") {
          self.loaded = true;
          removeLoadResponseHandler();
          resolve();
        } else if (action === "load_error") {
          removeLoadResponseHandler();
          reject(payload);
        }
      }

      self.worker.addEventListener("message", catchLoadResponse);
      self.postAction("load");
    });
  };
}

interface WWorker extends Worker {
  new (): WWorker;
}

export const createWorker = async (): Promise<CvWorker> => {
  const Worker = (await import("./cv.worker")).default as WWorker;
  console.log(Worker);
  return new CvWorker(new Worker());
};
