import { TTTVehicle } from "../user/user.constant";

interface ITTVehicle {
  year: number;
  brand: string;
  modelNo: string;
  gvwr: number; // Gross Vehicle Weight Rating
  type: TTTVehicle; // Vehicle type
  video: string; // Video URL or file path
}

export default ITTVehicle;
