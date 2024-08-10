/* global cv */
import { WorkerResultAction } from "./cv-types";

function postAction(action: WorkerResultAction, payload?: any) {
  return postMessage({ action, payload });
}

console.log("cv.worker.ts");

export default {};

const CV_LOAD_WAIT_TIME = 30 * 1000;

const hasOpenCv = () => !!cv.Mat;

const waitForOpenCv = (cb: (err: null | Error) => void) => {
  if (hasOpenCv()) {
    return cb(null);
  }

  const startTime = new Date().getTime();
  const interval = setInterval(() => {
    const now = new Date().getTime();

    if (hasOpenCv()) {
      clearInterval(interval);
      return cb(null);
    }

    if (now - startTime >= CV_LOAD_WAIT_TIME) {
      clearInterval(interval);
      return cb(new Error("OpenCV load time exceeded"));
    }
  }, 150);
};

const handleLoad = () => {
  self.importScripts("/js/opencv-4.6.0.js");

  waitForOpenCv((err) => {
    if (err) {
      return postAction("load_error", err);
    }
    postAction("load_success");
  });
};

const getColorSample = (lab: cv.Mat, point: cv.IPoint, rectSize: cv.ISize) => {
  const top = Math.floor(point.y - rectSize.height / 2);
  const right = Math.floor(point.x + rectSize.width / 2);
  const left = Math.floor(point.x - rectSize.width / 2);
  const bot = Math.floor(point.y + rectSize.height / 2);

  const sample = lab.roi({
    x: left,
    y: top,
    width: right - left,
    height: bot - top,
  });

  const meanColor = cv.mean(sample);
  sample.delete();

  return meanColor.map((n) => Math.round(n));
};

const clip = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(n, max));

const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

const interpolateSteps = (
  val: number,
  { min, max }: { min: number; max: number },
  steps: number[]
) => {
  const interp = mapRange(val, min, max, 0, steps.length - 1);
  const index = Math.round(interp);
  return steps[index];
};

const processScreenshot = (imageData: ImageData) => {
  try {
    const image = cv.matFromImageData(imageData);
    cv.cvtColor(image, image, cv.COLOR_RGBA2BGR);

    const height = image.rows;
    const width = image.cols;

    const uiHeightF = (9 / 16) * width;
    const uiHeight = Math.floor(uiHeightF);
    const uiTop = Math.floor((height - uiHeightF) / 2);

    const top = Math.floor(uiTop + uiHeightF / 3.18);
    const bot = uiTop + uiHeight;
    const right = Math.floor(width * 0.6);
    const left = 0;

    if (left < 0 || top < 0 || width < 0 || height < 0) {
      throw new Error("invalid image (too wide!)");
    }

    const croppedRoi = image.roi({
      x: left,
      y: top,
      width: right - left,
      height: bot - top,
    });
    const cropped = new cv.Mat();
    croppedRoi.copyTo(cropped);
    croppedRoi.delete();

    const approxGridOffset = uiHeightF / (1440 / 85.0);

    const codeMatrixCenterOrigX = width / 3.91;
    const graySamplePointOrigY = uiTop + uiHeightF / 2.0 - uiHeightF / 7.63251;
    const codeMatrixCenterCropX = codeMatrixCenterOrigX - left;
    const graySamplePointCroppedY = graySamplePointOrigY - top;

    // 2. Find the width of the first row's gray background
    const croppedLab = new cv.Mat();
    cv.cvtColor(cropped, croppedLab, cv.COLOR_BGR2Lab);
    const graySample = getColorSample(
      croppedLab,
      { x: codeMatrixCenterCropX, y: graySamplePointCroppedY },
      { width: 30, height: 10 }
    );
    const blueSample = getColorSample(
      croppedLab,
      {
        x: codeMatrixCenterCropX,
        y: Math.floor(graySamplePointCroppedY + approxGridOffset),
      },
      {
        width: 30,
        height: 10,
      }
    );

    console.log({ graySample, blueSample });
    const grayLower = new cv.Mat(
      croppedLab.rows,
      croppedLab.cols,
      croppedLab.type(),
      [...graySample.slice(0, 3).map((n) => clip(n - 12, 0, 255)), 0]
    );
    const grayUpper = new cv.Mat(
      croppedLab.rows,
      croppedLab.cols,
      croppedLab.type(),
      [...graySample.slice(0, 3).map((n) => clip(n + 12, 0, 255)), 0]
    );

    // Blur to decrease contrast of vertical border lines of the code matrix
    const croppedBlurred = new cv.Mat();
    croppedLab.copyTo(croppedBlurred);
    croppedLab.delete();
    cv.GaussianBlur(croppedBlurred, croppedBlurred, new cv.Size(3, 3), 0);

    const grayMask = new cv.Mat();
    cv.inRange(croppedBlurred, grayLower, grayUpper, grayMask);
    croppedBlurred.delete();
    grayLower.delete();
    grayUpper.delete();

    // Erode to remove the vertical border lines of the code matrix
    const erodeKernel = cv.Mat.ones(4, 4, cv.CV_8U);
    cv.erode(grayMask, grayMask, erodeKernel, new cv.Point(-1, -1), 1);
    erodeKernel.delete();

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      grayMask,
      contours,
      hierarchy,
      cv.RETR_LIST,
      cv.CHAIN_APPROX_SIMPLE
    );
    //grayMask.delete();
    hierarchy.delete();

    const boundingRects = grabBoundingRects(contours);
    contours.delete();

    const minGrayStripHeight = uiHeightF / 18.947;
    const maxGrayStripHeight = uiHeightF / 13.846;
    // really low lower bound, assume width at least as wide as 4x4 code matrix
    const minGrayStripWidth = width / 8.767;

    const grayStripRect = boundingRects.find(
      (rect) =>
        rect.height > minGrayStripHeight &&
        rect.height < maxGrayStripHeight &&
        rect.width > minGrayStripWidth
    );

    if (!grayStripRect) {
      cv.cvtColor(grayMask, grayMask, cv.COLOR_GRAY2RGBA);
      boundingRects.forEach((rect) => {
        cv.rectangle1(grayMask, rect, new cv.Scalar(0, 0, 255, 255));
      });
      const outImageData = toImageData(grayMask); //imageDataFromMat(cropped);
      console.log("could not find grayStripRect");
      postAction("process_screenshot_success", { comboImage: outImageData });

      setTimeout(() => {
        throw new Error("Gray strip could not be found in image!");
      }, 700);
    }
    grayMask.delete();

    // Distance from the left and right edges of the gray strip to the
    // leftmost and rightmost digit in the code matrix
    const approxDistToCode = width / 14;
    const newCropPadX = Math.floor(approxDistToCode - approxGridOffset / 2);

    const cropTop = 0;
    const cropBot = Math.floor(
      grayStripRect.x +
        grayStripRect.width -
        newCropPadX -
        (grayStripRect.x + newCropPadX) -
        approxGridOffset / 2
    );
    const cropLeft = grayStripRect.x + newCropPadX;
    const cropRight = grayStripRect.x + grayStripRect.width - newCropPadX;

    const gridCroppedRoi = cropped.roi({
      x: cropLeft,
      y: cropTop,
      width: cropRight - cropLeft,
      height: cropBot - cropTop,
    });
    const gridCroppedLab = new cv.Mat();
    gridCroppedRoi.copyTo(gridCroppedLab);
    gridCroppedRoi.delete();
    cropped.delete();

    // 3 - Change the horizontal gray strip's color to the background blue so it doesn't
    //     mess with our threshold. Could just do an Otsu threshold, but this one gives
    //     less bulky characters.
    cv.cvtColor(gridCroppedLab, gridCroppedLab, cv.COLOR_BGR2Lab);

    const gridGrayLower = new cv.Mat(
      gridCroppedLab.rows,
      gridCroppedLab.cols,
      gridCroppedLab.type(),
      [...graySample.slice(0, 3).map((n) => clip(n - 12, 0, 255)), 0]
    );
    const gridGrayUpper = new cv.Mat(
      gridCroppedLab.rows,
      gridCroppedLab.cols,
      gridCroppedLab.type(),
      [...graySample.slice(0, 3).map((n) => clip(n + 12, 0, 255)), 0]
    );
    const gridCroppedGrayMask = new cv.Mat();
    cv.inRange(
      gridCroppedLab,
      gridGrayLower,
      gridGrayUpper,
      gridCroppedGrayMask
    );
    gridGrayLower.delete();
    gridGrayUpper.delete();

    const gridBlueLower = new cv.Mat(
      gridCroppedLab.rows,
      gridCroppedLab.cols,
      gridCroppedLab.type(),
      [...blueSample.slice(0, 3).map((n) => clip(n - 24, 0, 255)), 0]
    );
    const gridBlueUpper = new cv.Mat(
      gridCroppedLab.rows,
      gridCroppedLab.cols,
      gridCroppedLab.type(),
      [...blueSample.slice(0, 3).map((n) => clip(n + 24, 0, 255)), 0]
    );
    const gridCroppedBlueMask = new cv.Mat();
    cv.inRange(
      gridCroppedLab,
      gridBlueLower,
      gridBlueUpper,
      gridCroppedBlueMask
    );
    gridBlueLower.delete();
    gridBlueUpper.delete();

    gridCroppedLab.setTo(blueSample, gridCroppedGrayMask);
    gridCroppedLab.setTo(blueSample, gridCroppedBlueMask);
    gridCroppedGrayMask.delete();
    gridCroppedBlueMask.delete();

    //const gray = new cv.Mat();
    //cv.cvtColor(cropped, gray, cv.COLOR_BGR2GRAY);
    //image.delete();

    const gridCropped = new cv.Mat();
    cv.cvtColor(gridCroppedLab, gridCropped, cv.COLOR_Lab2BGR);
    gridCroppedLab.delete();

    const gridSize = Math.round(
      (gridCropped.cols - approxGridOffset / 2) / approxGridOffset
    );
    console.log({ gridSize });

    const blurAmount = interpolateSteps(
      approxGridOffset,
      { min: 42, max: 85 },
      [3, 5, 7]
    );

    const gray = new cv.Mat();
    cv.cvtColor(gridCropped, gray, cv.COLOR_BGR2GRAY);
    gridCropped.delete();

    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(blurAmount, blurAmount), 0);
    gray.delete();

    const threshold = new cv.Mat();
    cv.threshold(blurred, threshold, 80, 255, cv.THRESH_BINARY);
    blurred.delete();
    cv.bitwise_not(threshold, threshold);

    const seqLeft = Math.floor(
      codeMatrixCenterCropX +
        (gridSize / 2.0) * grayStripRect.height +
        grayStripRect.height * 2
    );
    const seqRight = Math.floor(seqLeft + grayStripRect.height * 5);
    const seqTop = Math.floor(uiTop + uiHeightF * 0.31);
    const seqBot = Math.floor(seqTop + threshold.rows);
    const seqFontHeight = Math.floor(uiHeight / 60.0);
    const seqThreshold = getSequenceCrop(image, {
      crop: {
        x: seqLeft,
        y: seqTop,
        width: seqRight - seqLeft,
        height: seqBot - seqTop,
      },
      blur: interpolateSteps(seqFontHeight, { min: 12, max: 23 }, [3, 5]),
      dilateIterations: interpolateSteps(
        approxGridOffset,
        { min: 42.5, max: 85 },
        [3, 4, 5]
      ),
      fontHeight: seqFontHeight,
      gridHeight: Math.floor(uiHeight * 0.055),
    });
    image.delete();

    const outputs = new cv.MatVector();
    outputs.push_back(threshold);
    outputs.push_back(seqThreshold);
    const output = new cv.Mat();
    cv.hconcat(outputs, output);
    outputs.delete();

    const comboImage = new cv.Mat();
    cv.cvtColor(output, comboImage, cv.COLOR_GRAY2RGBA);
    output.delete();
    const comboImageData = toImageData(comboImage);
    comboImage.delete();

    const codeMatrix = new cv.Mat();
    cv.cvtColor(threshold, codeMatrix, cv.COLOR_GRAY2RGBA);
    threshold.delete();
    const codeMatrixImagedata = toImageData(codeMatrix);
    codeMatrix.delete();

    const sequences = new cv.Mat();
    cv.cvtColor(seqThreshold, sequences, cv.COLOR_GRAY2RGBA);
    seqThreshold.delete();
    const sequencesImageData = toImageData(sequences);
    sequences.delete();

    postAction("process_screenshot_success", {
      comboImage: comboImageData,
      codeMatrix: codeMatrixImagedata,
      sequences: sequencesImageData,
    });
  } catch (e) {
    postAction("process_screenshot_error", e);
  }
};

function getSequenceCrop(
  image: cv.Mat,
  {
    crop,
    blur,
    dilateIterations,
    fontHeight,
    gridHeight,
  }: {
    crop: cv.IRect;
    blur: number;
    dilateIterations: number;
    fontHeight: number;
    gridHeight: number;
  }
) {
  const cropRoi = image.roi(crop);
  const gray = new cv.Mat();
  cv.cvtColor(cropRoi, gray, cv.COLOR_BGR2GRAY);
  cropRoi.delete();

  const blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(blur, blur), 0);
  gray.delete();

  const threshold = new cv.Mat();
  cv.threshold(blurred, threshold, 80, 255, cv.THRESH_BINARY);
  blurred.delete();

  const dilateKernel = cv.Mat.ones(1, 3, cv.CV_8UC1);
  const dilated = new cv.Mat();
  cv.dilate(
    threshold,
    dilated,
    dilateKernel,
    new cv.Point(-1, -1),
    dilateIterations
  );

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(
    dilated,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_NONE
  );

  const allBoundingRects = grabBoundingRects(contours);
  contours.delete();
  hierarchy.delete();
  dilated.delete();

  const boundingRects = allBoundingRects.filter(
    (rect) => Math.abs(rect.height - fontHeight) < fontHeight * 0.25
  );

  if (boundingRects.length < 2) {
    threshold.delete();
    throw new Error("Unable to find sequence grid!");
  }

  const groups = groupRectsByGridRow(boundingRects, fontHeight);

  const legitGroups =
    groups.length < 2
      ? groups
      : groups.filter((group, i) => {
          const otherGroups = groups.filter((_, j) => j !== i);
          return isWithinGridHeightOfAnyOther(group, otherGroups, gridHeight);
        });

  // blank out any regions outside our target sequences
  const thresholdMask = cv.Mat.zeros(
    threshold.rows,
    threshold.cols,
    cv.CV_8UC1
  );
  legitGroups.forEach((group) => {
    const rect = getBoundingRect(group);
    const paddedrect = padRect(rect, Math.floor(fontHeight / 3));
    const roi = thresholdMask.roi(paddedrect);
    roi.setTo(new cv.Scalar(255));
    roi.delete();
  });

  const legitThreshold = new cv.Mat();
  cv.bitwise_and(threshold, thresholdMask, legitThreshold);
  thresholdMask.delete();
  threshold.delete();

  cv.bitwise_not(legitThreshold, legitThreshold);

  return legitThreshold;
}

function isWithinGridHeightOfAnyOther(
  group: cv.IRect[],
  otherGroups: cv.IRect[][],
  gridHeight: number
) {
  const groupRect = getBoundingRect(group);
  const midpoint = getMidpoint(groupRect);

  for (const otherGroup of otherGroups) {
    const otherMidpoint = getMidpoint(getBoundingRect(otherGroup));
    const distance = Math.abs(midpoint.y - otherMidpoint.y);

    // within grid height +-10%?
    if (Math.abs(distance - gridHeight) < 0.1 * gridHeight) {
      return true;
    }
  }

  return false;
}

/** warn: reorders `rects` */
function groupRectsByGridRow(
  rects: cv.IRect[],
  fontHeight: number
): cv.IRect[][] {
  rects.sort(compareByMidPoint);

  const groups: cv.IRect[][] = [];
  let currGroup = [rects[0]];

  for (let i = 1; i < rects.length; i++) {
    const rect = rects[i];
    const midpoint = getMidpoint(rect);

    if (
      Math.abs(midpoint.y - getCurrRowAvgMidpointY(currGroup)) >=
      fontHeight / 2
    ) {
      groups.push(currGroup);
      currGroup = [rect];
      continue;
    }

    currGroup.push(rect);
  }

  groups.push(currGroup);

  return groups;
}

function getBoundingRect(group: cv.IRect[]): cv.IRect {
  let maxLeft = group[0].x;
  let maxTop = group[0].y;
  let maxRight = group[0].x + group[0].width;
  let maxBot = group[0].y + group[0].height;
  for (let i = 0; i < group.length; i++) {
    const rect = group[i];
    if (rect.x < maxLeft) maxLeft = rect.x;
    if (rect.x + rect.width > maxRight) maxRight = rect.x + rect.width;
    if (rect.y < maxTop) maxTop = rect.y;
    if (rect.y + rect.height > maxBot) maxBot = rect.y + rect.height;
  }
  return {
    x: maxLeft,
    y: maxTop,
    width: maxRight - maxLeft,
    height: maxBot - maxTop,
  };
}

function padRect(rect: cv.IRect, pad: number) {
  return {
    x: rect.x - pad,
    y: rect.y - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };
}

function getCurrRowAvgMidpointY(group) {
  const midpointYs = group.map((rect) => getMidpoint(rect).y);
  return sum(midpointYs) / midpointYs.length;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b);
}

function getMidpoint(rect: cv.IRect) {
  return new cv.Point(
    Math.round(rect.x + rect.width / 2),
    Math.round(rect.y + rect.height / 2)
  );
}
function compareByMidPoint(a: cv.IRect, b: cv.IRect) {
  const aMid = getMidpoint(a);
  const bMid = getMidpoint(b);
  return aMid.x + aMid.y * 1000 - (bMid.x + bMid.y * 1000);
}

function grabBoundingRects(contours: cv.MatVector) {
  const rects: cv.IRect[] = [];

  const size = contours.size();
  for (let i = 0; i < size; i++) {
    const cnt = contours.get(i);
    rects.push(cv.boundingRect(cnt));
    cnt.delete();
  }

  return rects;
}

const toImageData = (mat: cv.Mat): ImageData => {
  if (mat.type() !== cv.CV_8UC4) {
    throw new Error(`Image must be RGBA! Type was ${mat.type()}.`);
  }
  return new ImageData(new Uint8ClampedArray(mat.data), mat.cols, mat.rows);
};

self.onmessage = function (e) {
  const { action, payload } = e.data;

  switch (action) {
    case "load":
      handleLoad();
      break;
    case "process_screenshot":
      processScreenshot(payload);
      break;
    default:
      break;
  }
};
