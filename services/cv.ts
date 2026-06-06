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
      const catchResponse = (e: MessageEvent) => {
        const action = e.data.action as WorkerResultAction;
        const payload = e.data.payload;

        if (action === "process_screenshot_success") {
          this.worker.removeEventListener("message", catchResponse);
          resolve(payload);
        } else if (action === "process_screenshot_error") {
          this.worker.removeEventListener("message", catchResponse);
          reject(payload);
        }
      };

      this.worker.addEventListener("message", catchResponse);
      this.postAction("process_screenshot", imageData);
    });
  };

  load = () => {
    if (this.loaded) {
      console.log("resolved");
      return Promise.resolve();
    }

    console.log("starting");
    return new Promise<void>((resolve, reject) => {
      const catchLoadResponse = (e: MessageEvent<any>) => {
        const { action, payload } = e.data;
        console.log("catchLoadResponse", e);

        if (action === "load_success") {
          this.loaded = true;
          this.worker.removeEventListener("message", catchLoadResponse);
          resolve();
        } else if (action === "load_error") {
          this.worker.removeEventListener("message", catchLoadResponse);
          reject(payload);
        }
      };

      this.worker.addEventListener("message", catchLoadResponse);
      this.postAction("load");
    });
  };
}

export const createWorker = async (): Promise<CvWorker> =>
  new CvWorker(new Worker(new URL("./cv.worker.ts", import.meta.url)));
