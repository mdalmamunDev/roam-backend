import { Types } from 'mongoose';
import IMechanic from './mechanic.interface';
import Mechanic from './mechanic.model';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';

const getMechanic = async (
  userId: Types.ObjectId | string
): Promise<IMechanic | null> => {
  // Logic to get a mechanic by userId
  const mechanic = await Mechanic.findOne({ userId })
    .populate({
      path: 'experiences.experienceId', // populate experienceId inside experiences array
    })
    .populate({
      path: 'tools', select: '-adminId' // assuming tools array stores IDs of tools
    })
    .lean();


  if (!mechanic) return null;

  // Group tools by their 'group' field
  const groupedTools = mechanic.tools.reduce((acc: Record<string, string[]>, tool: any) => {
    const group = tool.group || 'Unknown Group';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(tool.name);  // assuming tool_name holds the tool's name
    return acc;
  }, {});

  // Add the grouped tools to the mechanic object
  mechanic.toolsGroup = groupedTools;

  return mechanic;
};

const createMechanic = async (data: any): Promise<IMechanic> => {
  const mechanic = new Mechanic(data);
  const savedMechanic = await mechanic.save();

  if (!savedMechanic) {
    throw new Error('Failed to create mechanic');
  }

  return savedMechanic;
};

const updateMechanic = async (userId: string | Types.ObjectId, updateData: Partial<IMechanic>): Promise<any> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized.')
  }

  // Find the mechanic by userId and update the fields
  const mechanic = await Mechanic.findOneAndUpdate(
    { userId }, // Find mechanic by userId
    { $set: updateData }, // Update fields
    { new: true } // Return the updated document
  ).lean();

  if (!mechanic) {
    throw new Error('Mechanic not found');
  }

  return mechanic;
};

export const MechanicService = {
  getMechanic,
  createMechanic,
  updateMechanic,
};
