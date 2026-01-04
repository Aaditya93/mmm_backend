import Package from "../db/Package.js";
import dbConnect from "../db/connection.js";
import { PackageData } from "../ai/types.js";

export async function savePackageToDb(
  packageId: string,
  packageData: PackageData
): Promise<void> {
  try {
    const convertedData: any = { ...packageData };
    
    // Convert date strings to Date objects
    if (convertedData.startDate && typeof convertedData.startDate === 'string') {
      const [day, month, year] = convertedData.startDate.split("-").map(Number);
      convertedData.startDate = new Date(year, month - 1, day);
    }
    if (convertedData.endDate && typeof convertedData.endDate === 'string') {
      const [day, month, year] = convertedData.endDate.split("-").map(Number);
      convertedData.endDate = new Date(year, month - 1, day);
    }
    if (convertedData.bookingDeadline && typeof convertedData.bookingDeadline === 'string') {
      const [month, day, year] = convertedData.bookingDeadline
        .split("/")
        .map(Number);
      convertedData.bookingDeadline = new Date(year, month - 1, day);
    }

    if (convertedData.flights) {
      convertedData.flights = convertedData.flights.map((flight: any) => {
        if (flight.departure?.date) {
          const [day, month, year] = flight.departure.date
            .split("-")
            .map(Number);
          flight.departure.dateTime = new Date(year, month - 1, day);
        }
        if (flight.arrival?.date) {
          const [day, month, year] = flight.arrival.date.split("-").map(Number);
          flight.arrival.dateTime = new Date(year, month - 1, day);
        }
        return flight;
      });
    }

    await dbConnect();
    const res = await Package.findByIdAndUpdate(packageId, convertedData, {
      upsert: true,
    });
    console.log("MongoDB upsert result:", res);
    console.log(`Package data saved to MongoDB for: ${packageData.title}`);
  } catch (error) {
    console.error("Error saving package to DB:", error);
    throw new Error(`Failed to save package to DB: ${error}`);
  }
}
