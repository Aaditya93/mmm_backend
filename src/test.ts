import dotenv from "dotenv";
dotenv.config();

import { processPackagePdf } from "./ai.js";

// Example script to test processPackagePdf with a public S3 URL.
// Replace the URL below with a real public S3 link to a PDF you want to test.
(async () => {
  try {
    const publicPdfUrl =
      "https://travel-images1234.s3.ap-south-1.amazonaws.com/packages/PHU+QUOC+%E2%80%93+DANANG+%E2%80%93+HOI+AN+%E2%80%93+HANOI+%E2%80%93+NINH+BINH+-+HALONG+09+NIGHTS+AND+10+DAYS+VIETNAM+(1)+(1)+(1)+(1).pdf"; // <-- replace this

    console.log("Starting test for processPackagePdf with URL:", publicPdfUrl);
    const packageData = await processPackagePdf("", publicPdfUrl, "Vietnam");

    console.log("Process completed. Result:");
    console.log(JSON.stringify(packageData, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
})();
